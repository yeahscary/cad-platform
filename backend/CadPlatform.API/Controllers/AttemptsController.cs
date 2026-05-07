using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CadPlatform.Infrastructure.Persistence;
using CadPlatform.Domain.Entities;

namespace CadPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttemptsController : ControllerBase
{
    private readonly AppDbContext _db;
    public AttemptsController(AppDbContext db) => _db = db;

    // Начать тест
    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartAttemptDto dto)
    {
        var test = await _db.Tests.FindAsync(dto.TestId);
        if (test == null) return NotFound();

        var attempt = new TestAttempt
        {
            TestId = dto.TestId,
            StudentId = dto.StudentId,
            Status = AttemptStatus.InProgress,
            StartedAt = DateTime.UtcNow
        };

        _db.TestAttempts.Add(attempt);
        await _db.SaveChangesAsync();

        return Ok(new { attempt.Id });
    }

    // Отправить ответ на вопрос
    [HttpPost("{attemptId}/answer")]
    public async Task<IActionResult> Answer(Guid attemptId, [FromBody] AnswerDto dto)
    {
        var attempt = await _db.TestAttempts
            .Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null) return NotFound();
        if (attempt.Status != AttemptStatus.InProgress)
            return BadRequest(new { error = "Тест уже завершён" });

        var question = await _db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.Id == dto.QuestionId);

        if (question == null) return NotFound();

        bool isCorrect = false;
        decimal earned = 0;

        if (question.Type == QuestionType.SingleChoice ||
            question.Type == QuestionType.MultipleChoice)
        {
            var correctIds = question.Options
                .Where(o => o.IsCorrect)
                .Select(o => o.Id)
                .ToHashSet();

            var selectedIds = dto.SelectedOptionIds.ToHashSet();
            isCorrect = correctIds.SetEquals(selectedIds);
            earned = isCorrect ? question.Points : 0;
        }

        var answer = new StudentAnswer
        {
            AttemptId = attemptId,
            QuestionId = dto.QuestionId,
            SelectedOptionIds = dto.SelectedOptionIds,
            IsCorrect = isCorrect,
            EarnedPoints = earned
        };

        _db.StudentAnswers.Add(answer);
        await _db.SaveChangesAsync();

        return Ok(new { isCorrect, earned });
    }

    // Завершить тест
    [HttpPost("{attemptId}/finish")]
    public async Task<IActionResult> Finish(Guid attemptId)
    {
        var attempt = await _db.TestAttempts
            .Include(a => a.Answers)
            .Include(a => a.Test)
                .ThenInclude(t => t.Questions)
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null) return NotFound();

        var totalScore = attempt.Answers.Sum(a => a.EarnedPoints ?? 0);
        var maxScore = attempt.Test.Questions.Sum(q => q.Points);

        attempt.Score = totalScore;
        attempt.MaxScore = maxScore;
        attempt.Status = AttemptStatus.Completed;
        attempt.FinishedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            score = totalScore,
            maxScore,
            percent = maxScore > 0
                ? Math.Round(totalScore / maxScore * 100, 1)
                : 0
        });
    }

    // Результаты конкретного студента
    [HttpGet("my/{studentId}")]
    public IActionResult MyResults(Guid studentId)
    {
        var results = _db.TestAttempts
            .Include(a => a.Test)
            .Where(a => a.StudentId == studentId && a.Status == AttemptStatus.Completed)
            .Select(a => new
            {
                a.Id,
                TestTitle = a.Test.Title,
                a.Score,
                a.MaxScore,
                a.StartedAt,
                a.FinishedAt
            }).ToList();

        return Ok(results);
    }

    // Все результаты — для преподавателя
    [HttpGet("all")]
    public IActionResult AllResults()
    {
        var results = _db.TestAttempts
            .Include(a => a.Test)
            .Include(a => a.Student)
            .Where(a => a.Status == AttemptStatus.Completed)
            .Select(a => new
            {
                StudentName = a.Student != null
                    ? a.Student.FirstName + " " + a.Student.LastName
                    : "Неизвестно",
                TestTitle = a.Test != null ? a.Test.Title : "Неизвестно",
                a.Score,
                a.MaxScore,
                a.StartedAt,
                a.FinishedAt
            }).ToList();

        return Ok(results);
    }
}

public class StartAttemptDto
{
    public Guid TestId { get; set; }
    public Guid StudentId { get; set; }
}

public class AnswerDto
{
    public Guid QuestionId { get; set; }
    public List<Guid> SelectedOptionIds { get; set; } = new();
}