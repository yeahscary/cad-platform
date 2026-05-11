using netDxf;
using netDxf.Entities;

namespace CadPlatform.Infrastructure.CadProcessing;

public class CadCheckSettings
{
    public double TolerancePercent { get; set; } = 5.0;
    public bool CheckLineCount { get; set; } = true;
    public bool CheckCircleCount { get; set; } = true;
    public bool CheckDimensions { get; set; } = true;
    public bool CheckProportions { get; set; } = true;
    public int? ExpectedLineCount { get; set; }
    public int? ExpectedCircleCount { get; set; }
    public List<ExpectedDimension> ExpectedDimensions { get; set; } = new();
}

public class ExpectedDimension
{
    public string Name { get; set; } = string.Empty;
    public double Value { get; set; }
}

public class DxfCheckResult
{
    public bool Passed { get; set; }
    public double ScorePercent { get; set; }
    public double ScaleFactor { get; set; } = 1.0;
    public List<string> Errors { get; set; } = new();
    public List<string> PassedChecks { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}

public class DxfCheckerService
{
    public DxfCheckResult CheckWithReference(
        string studentFilePath,
        string referenceFilePath,
        CadCheckSettings settings)
    {
        var result = new DxfCheckResult();

        try
        {
            var studentDoc = DxfDocument.Load(studentFilePath);
            var referenceDoc = DxfDocument.Load(referenceFilePath);

            if (studentDoc == null || referenceDoc == null)
            {
                result.Passed = false;
                result.Summary = "Не удалось открыть один из файлов";
                return result;
            }

            // Получаем списки объектов
            var studentLines = studentDoc.Entities.Lines.ToList();
            var referenceLines = referenceDoc.Entities.Lines.ToList();
            var studentCircles = studentDoc.Entities.Circles.ToList();
            var referenceCircles = referenceDoc.Entities.Circles.ToList();

            double scaleFactor = DetectScaleFactor(studentLines, referenceLines, studentCircles, referenceCircles);
            result.ScaleFactor = scaleFactor;

            int totalChecks = 0;
            int passedCount = 0;

            // Проверка количества линий
            if (settings.CheckLineCount && settings.ExpectedLineCount.HasValue)
            {
                totalChecks++;
                int studentLineCount = studentLines.Count;
                int referenceLineCount = referenceLines.Count;

                if (studentLineCount >= referenceLineCount)
                {
                    passedCount++;
                    result.PassedChecks.Add($"Линии: {studentLineCount} (эталон: {referenceLineCount})");
                }
                else
                {
                    result.Errors.Add($"Линий недостаточно: {studentLineCount}, в эталоне {referenceLineCount}");
                }
            }

            // Проверка количества окружностей
            if (settings.CheckCircleCount && settings.ExpectedCircleCount.HasValue)
            {
                totalChecks++;
                int studentCircleCount = studentCircles.Count;
                int referenceCircleCount = referenceCircles.Count;

                if (studentCircleCount >= referenceCircleCount)
                {
                    passedCount++;
                    result.PassedChecks.Add($"Окружности: {studentCircleCount} (эталон: {referenceCircleCount})");
                }
                else
                {
                    result.Errors.Add($"Окружностей недостаточно: {studentCircleCount}, в эталоне {referenceCircleCount}");
                }
            }

            // Проверка пропорций
            if (settings.CheckProportions)
            {
                totalChecks++;
                bool proportionsOk = CheckProportions(studentLines, referenceLines, settings.TolerancePercent);
                if (proportionsOk)
                {
                    passedCount++;
                    result.PassedChecks.Add($"Пропорции верны (масштаб: 1:{Math.Round(scaleFactor, 2)})");
                }
                else
                {
                    result.Errors.Add("Пропорции объектов не совпадают с эталоном");
                }
            }

            // Проверка размеров
            if (settings.CheckDimensions && settings.ExpectedDimensions.Any())
            {
                var studentDimensions = ExtractDimensions(studentDoc);

                foreach (var expected in settings.ExpectedDimensions)
                {
                    totalChecks++;
                    double scaledExpected = expected.Value * scaleFactor;
                    double tolerance = scaledExpected * (settings.TolerancePercent / 100.0);

                    bool found = studentDimensions.Any(d => Math.Abs(d - scaledExpected) <= tolerance)
                              || studentDimensions.Any(d => Math.Abs(d - expected.Value) <= expected.Value * (settings.TolerancePercent / 100.0));

                    if (found)
                    {
                        passedCount++;
                        result.PassedChecks.Add($"Размер '{expected.Name}' = {expected.Value} мм — найден");
                    }
                    else
                    {
                        result.Errors.Add($"Размер '{expected.Name}' = {expected.Value} мм — не найден");
                    }
                }
            }

            // Если нет настроек — проверяем что файл не пустой
            if (totalChecks == 0)
            {
                totalChecks = 1;
                int objects = CountObjects(studentDoc);
                if (objects > 0)
                {
                    passedCount = 1;
                    result.PassedChecks.Add($"Файл содержит {objects} объектов");
                }
                else
                {
                    result.Errors.Add("Чертёж пустой");
                }
            }

            double percent = Math.Round((double)passedCount / totalChecks * 100, 1);
            result.Passed = percent >= 70;
            result.ScorePercent = percent;
            result.Summary = result.Passed
                ? $"Принято — {percent}%. Масштаб: 1:{Math.Round(scaleFactor, 2)}"
                : $"Не принято — {percent}%. Масштаб: 1:{Math.Round(scaleFactor, 2)}";
        }
        catch (Exception ex)
        {
            result.Passed = false;
            result.Summary = $"Ошибка: {ex.Message}";
            result.Errors.Add(ex.Message);
        }

        return result;
    }

    public DxfCheckResult Check(string filePath, CadCheckSettings settings)
    {
        var result = new DxfCheckResult();

        try
        {
            var doc = DxfDocument.Load(filePath);
            if (doc == null)
            {
                result.Passed = false;
                result.Summary = "Не удалось открыть файл";
                return result;
            }

            int objects = CountObjects(doc);
            result.Passed = objects > 0;
            result.ScorePercent = objects > 0 ? 100 : 0;
            result.Summary = objects > 0
                ? $"Файл принят, содержит {objects} объектов"
                : "Чертёж пустой";
        }
        catch (Exception ex)
        {
            result.Passed = false;
            result.Summary = $"Ошибка: {ex.Message}";
        }

        return result;
    }

    private double DetectScaleFactor(
        List<Line> studentLines,
        List<Line> referenceLines,
        List<Circle> studentCircles,
        List<Circle> referenceCircles)
    {
        var scaleFactors = new List<double>();

        var studentLengths = studentLines.Select(l => Distance(l.StartPoint, l.EndPoint)).OrderBy(x => x).ToList();
        var referenceLengths = referenceLines.Select(l => Distance(l.StartPoint, l.EndPoint)).OrderBy(x => x).ToList();

        int lineCount = Math.Min(studentLengths.Count, referenceLengths.Count);
        for (int i = 0; i < lineCount; i++)
        {
            if (referenceLengths[i] > 0.001)
                scaleFactors.Add(studentLengths[i] / referenceLengths[i]);
        }

        var studentRadii = studentCircles.Select(c => c.Radius).OrderBy(x => x).ToList();
        var referenceRadii = referenceCircles.Select(c => c.Radius).OrderBy(x => x).ToList();

        int circleCount = Math.Min(studentRadii.Count, referenceRadii.Count);
        for (int i = 0; i < circleCount; i++)
        {
            if (referenceRadii[i] > 0.001)
                scaleFactors.Add(studentRadii[i] / referenceRadii[i]);
        }

        if (scaleFactors.Count == 0) return 1.0;
        scaleFactors.Sort();
        return scaleFactors[scaleFactors.Count / 2];
    }

    private bool CheckProportions(
        List<Line> studentLines,
        List<Line> referenceLines,
        double tolerancePercent)
    {
        var studentLengths = studentLines.Select(l => Distance(l.StartPoint, l.EndPoint)).OrderByDescending(x => x).Take(10).ToList();
        var referenceLengths = referenceLines.Select(l => Distance(l.StartPoint, l.EndPoint)).OrderByDescending(x => x).Take(10).ToList();

        if (studentLengths.Count < 2 || referenceLengths.Count < 2) return true;

        int count = Math.Min(studentLengths.Count, referenceLengths.Count) - 1;
        int matches = 0;

        for (int i = 0; i < count; i++)
        {
            if (referenceLengths[i] < 0.001 || referenceLengths[i + 1] < 0.001) continue;

            double refRatio = referenceLengths[i] / referenceLengths[i + 1];
            double studentRatio = studentLengths[i] / (studentLengths[i + 1] + 0.001);
            double diff = Math.Abs(refRatio - studentRatio) / refRatio * 100;

            if (diff <= tolerancePercent) matches++;
        }

        return count == 0 || (double)matches / count >= 0.7;
    }

    private List<double> ExtractDimensions(DxfDocument doc)
    {
        var dims = new List<double>();
        foreach (var dim in doc.Entities.Dimensions)
        {
            if (dim is LinearDimension ld) dims.Add(ld.Measurement);
            else if (dim is AlignedDimension ad) dims.Add(ad.Measurement);
            else if (dim is RadialDimension rd) dims.Add(rd.Measurement);
            else if (dim is DiametricDimension dd) dims.Add(dd.Measurement);
        }
        return dims;
    }

    private double Distance(netDxf.Vector3 a, netDxf.Vector3 b) =>
        Math.Sqrt(Math.Pow(a.X - b.X, 2) + Math.Pow(a.Y - b.Y, 2));

    private int CountObjects(DxfDocument doc) =>
        doc.Entities.Lines.Count() +
        doc.Entities.Circles.Count() +
        doc.Entities.Arcs.Count() +
        doc.Entities.Polylines2D.Count();
}