


using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain
{
    public class MemberFile
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty; // e.g., "photo.jpg"

        [Required]
        public int Size { get; set; } // File size in bytes

        [Required]
        public byte[] ImageData { get; set; } = Array.Empty<byte>(); // Actual image bytes

        public string? FileDescription { get; set; }

        public string? PaymentId { get; set; }
        public Payment? Payment { get; set; }

        [Required]
        public string MemberId { get; set; } = string.Empty; // FK to Member (IdentityUser<string> uses string Id)
        public Member Member { get; set; } = null!;          // Navigation back to Member

        // Optional convenience property (not mapped to DB)
        [NotMapped]
        public string Base64Image => Convert.ToBase64String(ImageData);
    }
}



  
  

