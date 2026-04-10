using Microsoft.EntityFrameworkCore;
using CadPlatform.Domain.Entities;

namespace CadPlatform.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Test> Tests { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<QuestionOption> QuestionOptions { get; set; }
    public DbSet<TestAttempt> TestAttempts { get; set; }
    public DbSet<StudentAnswer> StudentAnswers { get; set; }
}