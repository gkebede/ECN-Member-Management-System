using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Dtos;
using Application.MediatR;
using Application.MediatR.Queries;
using FluentValidation;


namespace API.Controllers
{
    public class MembersController : BaseApiController
    {

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<MemberDto>>> GetMembers()
        {
            var result = await Mediator.Send(new GetMemberList.Query());
            return HandleResult(result);
        }



        [HttpGet("{id}")]
        public async Task<IActionResult> GetMember(Guid id)
        {
            try
            {
                var result = await Mediator.Send(new MemberDetails.Query { Id = id });
                return Ok(HandleResult(result));
            }
            catch (ValidationException ex)
            {
                return HandleValidationException(ex);
            }
        }


        [HttpPost]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateMember.Command command)
        {
            try
            {
                var result = await Mediator.Send(command);
                return HandleResult(result);
            }
            catch (ValidationException ex)
            {
                return HandleValidationException(ex);
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Edit(string id, MemberDto member)
        {
            try
            {
                // Log received data for debugging
                Console.WriteLine($"Update Member {id}:");
                Console.WriteLine($"  Addresses count: {member.Addresses?.Count ?? 0}");
                Console.WriteLine($"  FamilyMembers count: {member.FamilyMembers?.Count ?? 0}");
                Console.WriteLine($"  Payments count: {member.Payments?.Count ?? 0}");
                Console.WriteLine($"  Incidents count: {member.Incidents?.Count ?? 0}");
                Console.WriteLine($"  MemberFiles count: {member.MemberFiles?.Count ?? 0}");
                
                // Log incident details
                if (member.Incidents != null && member.Incidents.Any())
                {
                    Console.WriteLine("  Incident Details:");
                    foreach (var inc in member.Incidents)
                    {
                        Console.WriteLine($"    ID: {inc.Id}, IncidentDate: '{inc.IncidentDate}', PaymentDate: '{inc.PaymentDate}', EventNumber: {inc.EventNumber}");
                    }
                }
                
                var result = await Mediator.Send(new Update.Command(id, member));
                return Ok(HandleResult(result));
            }
            catch (ValidationException ex)
            {
                return HandleValidationException(ex);
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var result = await Mediator.Send(new Delete.Command { Id = id });
                return Ok(HandleResult(result));
            }
            catch (ValidationException ex)
            {
                return HandleValidationException(ex);
            }
        }

       // uploads files
        [HttpPost("uploads/{memberId}")]
         public async Task<IActionResult> UploadFiles(
             [FromRoute] Guid memberId,
             [FromForm] List<IFormFile> files,
             [FromForm] string? fileDescription,
             [FromForm] string? paymentId)
            {

                const long maxFileSize = 10 * 1024 * 1024; // 10 MB
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".pdf" };

                if (files == null || !files.Any())
                    return BadRequest("No files uploaded.");


                foreach (var file in files)
                {
                    var extension = Path.GetExtension(file.FileName).ToLower();
                    if (!allowedExtensions.Contains(extension))
                        return BadRequest($"Unsupported file type: {extension}");

                    if (file.Length > maxFileSize)
                        return BadRequest($"File '{file.FileName}' exceeds size limit (10MB).");

                }


                try
                {
                    var result = await Mediator.Send(new UploadFile.Command
                    {
                        MemberId = memberId.ToString(),
                        Files = files,
                        FileDescription = fileDescription,
                        PaymentId = paymentId
                    });

                    return result.IsSuccess
                        ? Ok(new
                        {
                            message = "Files uploaded successfully.",
                            files = result.Value
                        })
                        : BadRequest(result.Error);
                }
                catch (ValidationException ex)
                {
                    return HandleValidationException(ex);
                }
            }

        // Get ingle file
        [HttpGet("file/{memberId}")]
        public async Task<IActionResult> GetSingleFile(Guid memberId)
        {
            var result = await Mediator.Send(new GetMembeFiles.Query { Id = memberId });

            if (result == null || result.Value == null || !result.Value.Any())
                return NotFound();

            return Ok(result.Value.First()); // returns single File
        }

        // Get list of files
        [HttpGet("files/{memberId}")]
        public async Task<IActionResult> GetFiles(Guid memberId)
        {

            var result = await Mediator.Send(new GetMembeFiles.Query
            {
                Id = memberId
            });


            return Ok(result);
        }


    }
}


