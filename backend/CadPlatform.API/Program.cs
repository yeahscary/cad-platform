using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using CadPlatform.Infrastructure.Persistence;
using CadPlatform.Infrastructure.Identity;

var builder = WebApplication.CreateBuilder(args);

// База данных
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseInMemoryDatabase("CadPlatformDb"));

// JWT авторизация
var jwtKey = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// CORS — разрешаем React обращаться к API
builder.Services.AddCors(opt => opt.AddPolicy("Frontend", p =>
    p.AllowAnyOrigin()
     .AllowAnyHeader()
     .AllowAnyMethod()));

builder.Services.AddScoped<JwtService>();
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        // Отправляем enum как строку, а не число
        opt.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// Заполняем базу тестовыми данными
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!db.Tests.Any())
    {
        var test = new CadPlatform.Domain.Entities.Test
        {
            Title = "Основы AutoCAD",
            Description = "Базовый тест по работе с AutoCAD",
            IsPublished = true,
            TimeLimitMinutes = 20,
            Questions = new List<CadPlatform.Domain.Entities.Question>
            {
                new() {
                    Text = "Какая команда используется для построения отрезка в AutoCAD?",
                    Type = CadPlatform.Domain.Entities.QuestionType.SingleChoice,
                    Points = 1,
                    OrderIndex = 0,
                    Options = new List<CadPlatform.Domain.Entities.QuestionOption>
                    {
                        new() { Text = "LINE", IsCorrect = true, OrderIndex = 0 },
                        new() { Text = "CIRCLE", IsCorrect = false, OrderIndex = 1 },
                        new() { Text = "ARC", IsCorrect = false, OrderIndex = 2 },
                        new() { Text = "POLYLINE", IsCorrect = false, OrderIndex = 3 }
                    }
                },
                new() {
                    Text = "Что такое слой (Layer) в AutoCAD?",
                    Type = CadPlatform.Domain.Entities.QuestionType.SingleChoice,
                    Points = 1,
                    OrderIndex = 1,
                    Options = new List<CadPlatform.Domain.Entities.QuestionOption>
                    {
                        new() { Text = "Инструмент для группировки объектов", IsCorrect = true, OrderIndex = 0 },
                        new() { Text = "Тип линии", IsCorrect = false, OrderIndex = 1 },
                        new() { Text = "Команда копирования", IsCorrect = false, OrderIndex = 2 },
                        new() { Text = "Единица измерения", IsCorrect = false, OrderIndex = 3 }
                    }
                },
                new() {
                    Text = "Какие из этих команд служат для редактирования объектов?",
                    Type = CadPlatform.Domain.Entities.QuestionType.MultipleChoice,
                    Points = 2,
                    OrderIndex = 2,
                    Options = new List<CadPlatform.Domain.Entities.QuestionOption>
                    {
                        new() { Text = "MOVE", IsCorrect = true, OrderIndex = 0 },
                        new() { Text = "COPY", IsCorrect = true, OrderIndex = 1 },
                        new() { Text = "LINE", IsCorrect = false, OrderIndex = 2 },
                        new() { Text = "TRIM", IsCorrect = true, OrderIndex = 3 }
                    }
                }
            }
        };
        var cadTest = new CadPlatform.Domain.Entities.Test
        {
            Title = "Чертёж детали — практика",
            Description = "Загрузите чертёж выполненный в AutoCAD",
            IsPublished = true,
            TimeLimitMinutes = 60,
            Questions = new List<CadPlatform.Domain.Entities.Question>
            {
                new() {
                    Text = "Постройте деталь по заданию и загрузите файл чертежа в формате DWG или DXF",
                    Type = CadPlatform.Domain.Entities.QuestionType.CadUpload,
                    Points = 3,
                    OrderIndex = 0,
                    Options = new List<CadPlatform.Domain.Entities.QuestionOption>()
                }
            }
        };
        db.Tests.Add(cadTest);
        db.SaveChanges();

        db.Tests.Add(test);
        db.SaveChanges();
    }
}
app.Run();