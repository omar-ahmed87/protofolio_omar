using System.ComponentModel.DataAnnotations;

namespace PortfolioBackend.Models
{
    public class Project
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        // Comma separated tags e.g. "HTML, CSS, React"
        [MaxLength(200)]
        public string Tags { get; set; } = string.Empty;
        
        [MaxLength(300)]
        public string Link { get; set; } = string.Empty;

        [MaxLength(300)]
        public string ImageUrl { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
