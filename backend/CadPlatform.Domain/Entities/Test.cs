namespace CadPlatform.Domain.Entities;

public class Test
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // false = черновик, true = студенты видят тест
    public bool IsPublished { get; set; } = false;

    // Лимит в минутах, null = без ограничения
    public int? TimeLimitMinutes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Кто создал — ID преподавателя
    public Guid CreatedById { get; set; }
    public User? CreatedBy { get; set; }

    public List<Question> Questions { get; set; } = new();
}