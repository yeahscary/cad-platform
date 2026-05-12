using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CadPlatform.Infrastructure.Persistence;
using CadPlatform.Domain.Entities;

namespace CadPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TestsController(AppDbContext db) => _db = db;

    // Получить список всех тестов
    [HttpGet]
    public IActionResult GetAll()
    {
        var tests = _db.Tests
            .Where(t => t.IsPublished)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.TimeLimitMinutes,
                QuestionCount = t.Questions.Count
            }).ToList();

        return Ok(tests);
    }

    // Получить один тест с вопросами
    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var test = _db.Tests
            .Where(t => t.Id == id)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                t.TimeLimitMinutes,
                Questions = t.Questions
                    .OrderBy(q => q.OrderIndex)
                    .Select(q => new
                    {
                        q.Id,
                        q.Text,
                        q.Type,
                        q.Points,
                        Options = q.Options
                            .OrderBy(o => o.OrderIndex)
                            .Select(o => new { o.Id, o.Text })
                    })
            }).FirstOrDefault();

        if (test == null) return NotFound();
        return Ok(test);
    }

    // Создать тест
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTestDto dto)
    {
        // Берём первого преподавателя из БД как автора
        var teacher = _db.Users.FirstOrDefault(u => u.Role == "Teacher");
        if (teacher == null)
            return BadRequest(new { error = "Преподаватель не найден" });

        var test = new Test
        {
            Title = dto.Title,
            Description = dto.Description ?? string.Empty,
            IsPublished = false,
            TimeLimitMinutes = dto.TimeLimitMinutes,
            CreatedById = teacher.Id
        };

        for (int i = 0; i < dto.Questions.Count; i++)
        {
            var q = dto.Questions[i];
            var question = new Question
            {
                Text = q.Text,
                Type = Enum.Parse<QuestionType>(q.Type),
                Points = q.Points,
                OrderIndex = i,
                Options = q.Options.Select((o, idx) => new QuestionOption
                {
                    Text = o.Text,
                    IsCorrect = o.IsCorrect,
                    OrderIndex = idx
                }).ToList()
            };
            test.Questions.Add(question);
        }

        _db.Tests.Add(test);
        await _db.SaveChangesAsync();

        return Ok(new { test.Id, test.Title });
    }

    // Опубликовать тест
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var test = await _db.Tests.FindAsync(id);
        if (test == null) return NotFound();

        test.IsPublished = true;
        await _db.SaveChangesAsync();
        return Ok();
    }
}

// DTO классы
public class CreateTestDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? TimeLimitMinutes { get; set; }
    public List<CreateQuestionDto> Questions { get; set; } = new();
}

public class CreateQuestionDto
{
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = "SingleChoice";
    public decimal Points { get; set; } = 1;
    public List<CreateOptionDto> Options { get; set; } = new();
}

public class CreateOptionDto
{
    public string Text { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}