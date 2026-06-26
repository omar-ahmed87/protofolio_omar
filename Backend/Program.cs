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

// Bind to the PORT environment variable provided by Railway, or 5000 locally
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
var urls = new System.Collections.Generic.HashSet<string> { $"http://*:{port}", "http://*:5000", "http://*:8080" };
builder.WebHost.UseUrls(urls.ToArray());

var app = builder.Build();

app.UseCors("AllowAll");

string frontendPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
if (!Directory.Exists(frontendPath))
{
    // Try fallback
    var fallback = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "Frontend"));
    if (Directory.Exists(fallback))
    {
        frontendPath = fallback;
    }
}

try
{
    if (Directory.Exists(frontendPath))
    {
        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendPath),
            RequestPath = ""
        });
    }
    else
    {
        Console.WriteLine($"WARNING: Frontend directory not found at {frontendPath}. Static files will not be served.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR configuring static files: {ex.Message}");
}

// Diagnostic endpoint
app.MapGet("/ping", () => Results.Ok(new { Status = "Alive", Port = port, BaseDir = AppContext.BaseDirectory, FrontendPath = frontendPath }));


// Default page
app.MapGet("/", () => Results.Redirect("/index.html"));


// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated(); // Only creates if not exists

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
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR initializing database: {ex.Message}");
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
