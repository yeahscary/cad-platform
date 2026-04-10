namespace CadPlatform.Domain.Entities;

public enum QuestionType
{
    SingleChoice,    // один правильный ответ
    MultipleChoice,  // несколько правильных
    CadUpload        // загрузка DWG/DXF файла
}

public class Question
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TestId { get; set; }
    public Test? Test { get; set; }

    public string Text { get; set; } = string.Empty;
    public QuestionType Type { get; set; }
    public decimal Points { get; set; } = 1;
    public int OrderIndex { get; set; }

    public List<QuestionOption> Options { get; set; } = new();
}