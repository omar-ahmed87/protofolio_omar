using Microsoft.EntityFrameworkCore;
using PortfolioBackend.Data;
using PortfolioBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure CORS to allow frontend to access the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

// Serve frontend static files
// In Railway (published), wwwroot/Frontend is next to the dll
// Locally, Frontend folder is one level up from Backend/
string frontendPath;
var publishedPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (Directory.Exists(publishedPath))
{
    frontendPath = publishedPath;
}
else
{
    frontendPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "Frontend"));
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendPath),
    RequestPath = ""
});

// Default page
app.MapGet("/", () => Results.Redirect("/index.html"));


// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // Only creates if not exists — preserves data on restart

    // Seed the DTracks project automatically
    if (!db.Projects.Any())
    {
        db.Projects.Add(new Project {
            Name = "DTracks App",
            Description = "This project serves for transportation and tracking.",
            Tags = "Html, css, typescript, angular, .net",
            Link = "https://dtracks.up.railway.app/"
        });
        db.SaveChanges();
    }
}

// Endpoints

// GET /api/contact - Retrieve all messages for the dashboard
app.MapGet("/api/contact", async (HttpContext context, AppDbContext db) =>
{
    var password = context.Request.Headers["x-admin-password"].FirstOrDefault();
    if (password != "Omar13138585@")
    {
        return Results.Unauthorized();
    }

    var messages = await db.ContactMessages.OrderByDescending(m => m.CreatedAt).ToListAsync();
    return Results.Ok(messages);
});

app.MapPost("/api/contact", async (ContactMessage message, AppDbContext db) =>
{
    message.CreatedAt = DateTime.UtcNow;
    db.ContactMessages.Add(message);
    await db.SaveChangesAsync();
    return Results.Created($"/api/contact/{message.Id}", message);
});

// DELETE /api/contact/{id} - Delete a contact message
app.MapDelete("/api/contact/{id}", async (HttpContext context, int id, AppDbContext db) =>
{
    var password = context.Request.Headers["x-admin-password"].FirstOrDefault();
    if (password != "Omar13138585@")
    {
        return Results.Unauthorized();
    }

    var msg = await db.ContactMessages.FindAsync(id);
    if (msg == null) return Results.NotFound();

    db.ContactMessages.Remove(msg);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

// GET /api/projects - Retrieve all projects
app.MapGet("/api/projects", async (AppDbContext db) =>
{
    var projects = await db.Projects.OrderByDescending(p => p.CreatedAt).ToListAsync();
    return Results.Ok(projects);
});

// POST /api/projects - Add a new project
app.MapPost("/api/projects", async (HttpContext context, Project project, AppDbContext db) =>
{
    var password = context.Request.Headers["x-admin-password"].FirstOrDefault();
    if (password != "Omar13138585@")
    {
        return Results.Unauthorized();
    }

    project.CreatedAt = DateTime.UtcNow;
    db.Projects.Add(project);
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{project.Id}", project);
});

// DELETE /api/projects/{id} - Delete a project
app.MapDelete("/api/projects/{id}", async (HttpContext context, int id, AppDbContext db) =>
{
    var password = context.Request.Headers["x-admin-password"].FirstOrDefault();
    if (password != "Omar13138585@")
    {
        return Results.Unauthorized();
    }

    var project = await db.Projects.FindAsync(id);
    if (project == null) return Results.NotFound();

    db.Projects.Remove(project);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();
