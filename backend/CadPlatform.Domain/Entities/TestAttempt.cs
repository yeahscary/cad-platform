namespace CadPlatform.Domain.Entities;

public enum AttemptStatus { InProgress, Completed, TimedOut }

public class TestAttempt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TestId { get; set; }
    public Test? Test { get; set; }
    public Guid StudentId { get; set; }
    public User? Student { get; set; }

    public AttemptStatus Status { get; set; } = AttemptStatus.InProgress;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FinishedAt { get; set; }

    public decimal? Score { get; set; }
    public decimal? MaxScore { get; set; }

    public List<StudentAnswer> Answers { get; set; } = new();
}