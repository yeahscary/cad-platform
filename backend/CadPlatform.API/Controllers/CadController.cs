using Microsoft.AspNetCore.Mvc;
using CadPlatform.Infrastructure.Persistence;
using CadPlatform.Domain.Entities;

namespace CadPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CadController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public CadController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // Загрузка DWG/DXF файла студентом
    [HttpPost("upload/{attemptId}/{questionId}")]
    public async Task<IActionResult> Upload(
        Guid attemptId,
        Guid questionId,
        IFormFile file)
    {
        // Проверяем расширение файла
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext != ".dwg" && ext != ".dxf")
            return BadRequest(new { error = "Только файлы DWG и DXF" });

        // Проверяем размер — не больше 50 МБ
        if (file.Length > 52_428_800)
            return BadRequest(new { error = "Файл слишком большой (макс. 50 МБ)" });

        // Папка для сохранения файлов
        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "cad");
        Directory.CreateDirectory(uploadDir);

        // Уникальное имя файла
        var fileName = $"{attemptId}_{questionId}_{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        // Сохраняем файл
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Находим ответ студента
        var answer = _db.StudentAnswers
            .FirstOrDefault(a => a.AttemptId == attemptId && a.QuestionId == questionId);

        if (answer == null)
        {
            // Создаём новый ответ если его нет
            answer = new StudentAnswer
            {
                AttemptId = attemptId,
                QuestionId = questionId,
                IsCorrect = null,
                EarnedPoints = null
            };
            _db.StudentAnswers.Add(answer);
        }

        await _db.SaveChangesAsync();

        // Запускаем простую проверку файла
        var checkResult = await CheckCadFile(filePath, ext);

        // Обновляем результат ответа
        answer.IsCorrect = checkResult.Passed;
        answer.EarnedPoints = checkResult.Passed ? 3 : 0;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            fileName = file.FileName,
            status = checkResult.Passed ? "Passed" : "Failed",
            message = checkResult.Message,
            score = answer.EarnedPoints
        });
    }

    // Простая проверка CAD файла
    private async Task<CadCheckResult> CheckCadFile(string filePath, string ext)
    {
        await Task.Delay(500); // имитация обработки

        var fileInfo = new FileInfo(filePath);

        // Проверяем что файл не пустой
        if (fileInfo.Length < 100)
            return new CadCheckResult(false, "Файл пустой или повреждён");

        // Проверяем заголовок DWG файла
        if (ext == ".dwg")
        {
            var header = new byte[6];
            using var fs = new FileStream(filePath, FileMode.Open);
            await fs.ReadAsync(header, 0, 6);
            var headerStr = System.Text.Encoding.ASCII.GetString(header);

            // DWG файлы начинаются с "AC" (AutoCAD)
            if (!headerStr.StartsWith("AC"))
                return new CadCheckResult(false, "Файл не является корректным DWG файлом");
        }

        return new CadCheckResult(true, "Файл успешно проверен и принят");
    }
}

public record CadCheckResult(bool Passed, string Message);