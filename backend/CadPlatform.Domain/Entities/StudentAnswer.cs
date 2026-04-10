namespace CadPlatform.Domain.Entities;

public class StudentAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AttemptId { get; set; }
    public TestAttempt? Attempt { get; set; }
    public Guid QuestionId { get; set; }
    public Question? Question { get; set; }

    // Список ID выбранных вариантов
    public List<Guid> SelectedOptionIds { get; set; } = new();

    // null = ещё не проверено (например, CAD-файл ещё обрабатывается)
    public bool? IsCorrect { get; set; }
    public decimal? EarnedPoints { get; set; }

    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;
}