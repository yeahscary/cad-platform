using Microsoft.AspNetCore.Mvc;
using CadPlatform.Infrastructure.Persistence;
using CadPlatform.Domain.Entities;
using CadPlatform.Infrastructure.CadProcessing;
using Microsoft.EntityFrameworkCore;

namespace CadPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CadController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly DxfCheckerService _checker;

    public CadController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
        _checker = new DxfCheckerService();
    }

    // Преподаватель загружает эталонный чертёж для вопроса
    [HttpPost("reference/{questionId}")]
    public async Task<IActionResult> UploadReference(Guid questionId, IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext != ".dwg" && ext != ".dxf")
            return BadRequest(new { error = "Только файлы DWG и DXF" });

        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "reference");
        Directory.CreateDirectory(uploadDir);

        // Удаляем старый эталон если был
        var oldPath = Path.Combine(uploadDir, $"{questionId}{ext}");
        if (System.IO.File.Exists(oldPath))
            System.IO.File.Delete(oldPath);

        var fileName = $"{questionId}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new
        {
            questionId,
            fileName = file.FileName,
            message = "Эталонный чертёж загружен успешно"
        });
    }

    // Проверить есть ли эталон для вопроса
    [HttpGet("reference/{questionId}/exists")]
    public IActionResult ReferenceExists(Guid questionId)
    {
        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "reference");
        var dwgPath = Path.Combine(uploadDir, $"{questionId}.dwg");
        var dxfPath = Path.Combine(uploadDir, $"{questionId}.dxf");

        bool exists = System.IO.File.Exists(dwgPath) || System.IO.File.Exists(dxfPath);
        return Ok(new { exists });
    }

    // Студент загружает свой чертёж
    [HttpPost("upload/{attemptId}/{questionId}")]
    public async Task<IActionResult> Upload(
        Guid attemptId,
        Guid questionId,
        IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext != ".dwg" && ext != ".dxf")
            return BadRequest(new { error = "Только файлы DWG и DXF" });

        if (file.Length > 52_428_800)
            return BadRequest(new { error = "Файл слишком большой (макс. 50 МБ)" });

        // Сохраняем файл студента
        var uploadDir = Path.Combine(_env.ContentRootPath, "uploads", "cad");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{attemptId}_{questionId}_{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        DxfCheckResult checkResult;

        // Ищем эталонный чертёж для этого вопроса
        var refDir = Path.Combine(_env.ContentRootPath, "uploads", "reference");
        var refDxfPath = Path.Combine(refDir, $"{questionId}.dxf");
        var refDwgPath = Path.Combine(refDir, $"{questionId}.dwg");

        bool hasReference = System.IO.File.Exists(refDxfPath) ||
                            System.IO.File.Exists(refDwgPath);

        if (hasReference && ext == ".dxf")
        {
            // Есть эталон и файл студента DXF — полная проверка с масштабом
            string refPath = System.IO.File.Exists(refDxfPath) ? refDxfPath : refDwgPath;

            var settings = new CadCheckSettings
            {
                TolerancePercent = 5.0,
                CheckLineCount = true,
                CheckCircleCount = true,
                CheckProportions = true,
                CheckDimensions = false
            };

            // Если эталон DXF — сравниваем полностью
            if (refPath.EndsWith(".dxf"))
            {
                checkResult = _checker.CheckWithReference(filePath, refPath, settings);
            }
            else
            {
                // Эталон DWG — базовая проверка
                checkResult = _checker.Check(filePath, settings);
            }
        }
        else if (ext == ".dxf")
        {
            // Нет эталона но файл DXF — проверяем что не пустой
            checkResult = _checker.Check(filePath, new CadCheckSettings());
        }
        else
        {
            // DWG файл — проверяем заголовок
            var fileInfo = new FileInfo(filePath);
            var header = new byte[6];
            using var fs = new FileStream(filePath, FileMode.Open);
            await fs.ReadAsync(header.AsMemory(0, 6));
            var headerStr = System.Text.Encoding.ASCII.GetString(header);
            bool validDwg = headerStr.StartsWith("AC") && fileInfo.Length > 100;

            checkResult = new DxfCheckResult
            {
                Passed = validDwg,
                ScorePercent = validDwg ? 100 : 0,
                Summary = validDwg ? "DWG файл принят" : "Файл повреждён"
            };
        }

        // Сохраняем результат
        var answer = _db.StudentAnswers
            .FirstOrDefault(a => a.AttemptId == attemptId && a.QuestionId == questionId);

        if (answer == null)
        {
            answer = new StudentAnswer
            {
                AttemptId = attemptId,
                QuestionId = questionId
            };
            _db.StudentAnswers.Add(answer);
        }

        answer.IsCorrect = checkResult.Passed;
        answer.EarnedPoints = checkResult.Passed ? 3 : 0;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            fileName = file.FileName,
            status = checkResult.Passed ? "Passed" : "Failed",
            message = checkResult.Summary,
            score = answer.EarnedPoints,
            scaleFactor = checkResult.ScaleFactor,
            passedChecks = checkResult.PassedChecks,
            errors = checkResult.Errors,
            hasReference
        });
    }
}