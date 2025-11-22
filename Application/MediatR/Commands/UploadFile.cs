using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Application.Dtos;
using Domain;
using Application.Core;
using Persistence;

namespace Application.MediatR
{
    public class UploadFile
    {
        public class Command : IRequest<Result<List<MemberFileDto>>>
        {
            public List<IFormFile> Files { get; set; } = new List<IFormFile>();
            public string MemberId { get; set; } = string.Empty;
            public string? PaymentId { get; set; }
            public string? FileDescription { get; set; }
        }

        public class Handler : IRequestHandler<Command, Result<List<MemberFileDto>>>
        {
            private readonly AppDbContext _dbContext;

            public Handler(AppDbContext dbContext)
            {
                _dbContext = dbContext;
            }

            public async Task<Result<List<MemberFileDto>>> Handle(Command request, CancellationToken cancellationToken)
            {
                if (request.Files == null || !request.Files.Any())
                    return Result<List<MemberFileDto>>.Failure("No files uploaded.");

                try
                {
                    var member = await _dbContext.Members
                        .Include(m => m.MemberFiles)
                        .FirstOrDefaultAsync(m => m.Id == request.MemberId.ToString(), cancellationToken);

                    if (member == null)
                        return Result<List<MemberFileDto>>.Failure("Member not found.");

                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
                    var uploadedFiles = new List<MemberFile>();

                    foreach (var formFile in request.Files)
                    {
                        if (formFile.Length == 0)
                            continue;

                        var extension = Path.GetExtension(formFile.FileName).ToLowerInvariant();
                        if (!allowedExtensions.Contains(extension))
                            return Result<List<MemberFileDto>>.Failure($"Invalid file type: {formFile.FileName}");

                        byte[] fileBytes;
                        using (var ms = new MemoryStream())
                        {
                            await formFile.CopyToAsync(ms, cancellationToken);
                            fileBytes = ms.ToArray();
                        }

                        var memberFile = new MemberFile
                        {
                            FileName = formFile.FileName,
                            Size = (int)formFile.Length,
                            ImageData = fileBytes, // Save the actual file bytes
                            MemberId = member.Id,
                            Member = member,
                            PaymentId = request.PaymentId,
                            FileDescription = request.FileDescription
                        };

                        _dbContext.MemberFiles.Add(memberFile);
                        uploadedFiles.Add(memberFile);
                    }

                    await _dbContext.SaveChangesAsync(cancellationToken);

                    // Return DTOs with ImageData so they can be displayed in the UI
                    var dtoList = uploadedFiles.Select(f => new MemberFileDto
                    {
                        Id = f.Id.ToString(),
                        FileName = f.FileName,
                        Size = f.Size,
                        ImageData = f.ImageData, // Include ImageData so Base64FileData can be computed
                        PaymentId = f.PaymentId,
                        FileDescription = f.FileDescription
                    }).ToList();

                    return Result<List<MemberFileDto>>.Success(dtoList);
                }
                catch (DbUpdateException dbEx)
                {
                    return Result<List<MemberFileDto>>.Failure($"Database error: {dbEx.Message}");
                }
                catch (Exception ex)
                {
                    return Result<List<MemberFileDto>>.Failure($"An unexpected error occurred: {ex.Message}");
                }
            }
        }
    }
}
