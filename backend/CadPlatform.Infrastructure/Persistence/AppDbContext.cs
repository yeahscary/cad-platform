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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // StudentAnswer — список Guid храним как массив в PostgreSQL
        modelBuilder.Entity<StudentAnswer>()
            .Property(a => a.SelectedOptionIds)
            .HasColumnType("uuid[]");

        // Индексы для быстрого поиска
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<TestAttempt>()
            .HasIndex(a => a.StudentId);

        modelBuilder.Entity<TestAttempt>()
            .HasIndex(a => a.TestId);

        modelBuilder.Entity<StudentAnswer>()
            .HasIndex(a => a.AttemptId);
    }
}