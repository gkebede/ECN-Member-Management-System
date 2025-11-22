namespace Application.Dtos
{
public class MemberFileDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public int Size { get; set; }
    public byte[] ImageData { get; set; }
    public string Base64FileData => ImageData != null ? Convert.ToBase64String(ImageData) : null;
    public string MemberId { get; set; }
    public string? FileDescription { get; set; }
    public string? PaymentId { get; set; }
}

}

 

