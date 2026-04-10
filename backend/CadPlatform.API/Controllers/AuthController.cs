using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CadPlatform.Application.DTOs.Auth;
using CadPlatform.Domain.Entities;
using CadPlatform.Infrastructure.Identity;
using CadPlatform.Infrastructure.Persistence;

namespace CadPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == req.Email);
        if (exists)
            return BadRequest(new { error = "Email уже занят" });

        var user = new User
        {
            Email = req.Email,
            FirstName = req.FirstName,
            LastName = req.LastName,
            Role = req.Role == "Teacher" ? "Teacher" : "Student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new AuthResponse
        {
            AccessToken = _jwt.GenerateToken(user),
            Role = user.Role,
            FirstName = user.FirstName,
            Email = user.Email,
            UserId = user.Id
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == req.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Неверный email или пароль" });

        return Ok(new AuthResponse
        {
            AccessToken = _jwt.GenerateToken(user),
            Role = user.Role,
            FirstName = user.FirstName,
            Email = user.Email,
            UserId = user.Id
        });
    }
}