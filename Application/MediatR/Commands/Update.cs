using Application.Core;
using Application.Dtos;
using Application.Utilities;
using AutoMapper;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.MediatR
{
    /// <summary>
    /// Handles updating an existing Member, including scalar fields and related navigation properties.
    /// Uses EF Core only (no UserManager) so everything is updated in one transaction.
    /// </summary>
    public class Update
    {
        // --- Command ---
        public class Command : IRequest<Result<MemberDto>>
        {
            public string Id { get; }
            public MemberDto MemberDto { get; }

            public Command(string id, MemberDto memberDto)
            {
                Id = id ?? throw new ArgumentNullException(nameof(id));
                MemberDto = memberDto ?? throw new ArgumentNullException(nameof(memberDto));
            }
        }

        // --- Handler ---
        public class Handler : IRequestHandler<Command, Result<MemberDto>>
        {
            private readonly AppDbContext _context;
            private readonly IMapper _mapper;

            public Handler(AppDbContext context, IMapper mapper)
            {
                _context = context;
                _mapper = mapper;
            }

            public async Task<Result<MemberDto>> Handle(Command request, CancellationToken cancellationToken)
            {
                // Load member with related data
                var member = await _context.Members
                    .Include(m => m.Payments)
                    .Include(m => m.Addresses)
                    .Include(m => m.FamilyMembers)
                    .Include(m => m.MemberFiles)
                    .Include(m => m.Incidents)
                    .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

                if (member == null)
                    return Result<MemberDto>.Failure("No member found.");

                // Log received DTO data for debugging
                Console.WriteLine($"Update Handler - Received DTO:");
                Console.WriteLine($"  Addresses: {request.MemberDto.Addresses?.Count ?? 0}");
                Console.WriteLine($"  FamilyMembers: {request.MemberDto.FamilyMembers?.Count ?? 0}");
                Console.WriteLine($"  Payments: {request.MemberDto.Payments?.Count ?? 0}");
                Console.WriteLine($"  Incidents: {request.MemberDto.Incidents?.Count ?? 0}");
                Console.WriteLine($"  MemberFiles: {request.MemberDto.MemberFiles?.Count ?? 0}");

                // Map scalar (non-navigation) properties
                _mapper.Map(request.MemberDto, member);

                // --- Update navigation properties ---
                // Ensure we have valid collections (not null)
                if (request.MemberDto.Addresses != null)
                {
                    EntityUpdater.UpdateMemberNavigation(member.Addresses, request.MemberDto.Addresses, _mapper, id => id);
                    // Set MemberId for all addresses (in case new ones were added)
                    foreach (var addr in member.Addresses)
                    {
                        if (string.IsNullOrEmpty(addr.MemberId))
                            addr.MemberId = member.Id;
                    }
                }
                if (request.MemberDto.FamilyMembers != null)
                {
                    EntityUpdater.UpdateMemberNavigation(member.FamilyMembers, request.MemberDto.FamilyMembers, _mapper, id => id);
                    // Set MemberId for all family members (in case new ones were added)
                    foreach (var fm in member.FamilyMembers)
                    {
                        if (string.IsNullOrEmpty(fm.MemberId))
                            fm.MemberId = member.Id;
                    }
                }
                if (request.MemberDto.MemberFiles != null)
                {
                    EntityUpdater.UpdateMemberNavigation(member.MemberFiles, request.MemberDto.MemberFiles, _mapper, id => id);
                    // Set MemberId for all member files (in case new ones were added)
                    foreach (var mf in member.MemberFiles)
                    {
                        if (string.IsNullOrEmpty(mf.MemberId))
                            mf.MemberId = member.Id;
                    }
                }
                if (request.MemberDto.Payments != null)
                {
                    // Store existing payment dates and amounts before mapping to preserve them if new values are invalid
                    var existingPaymentDates = member.Payments.ToDictionary(p => p.Id.ToString(), p => p.PaymentDate);
                    var existingPaymentAmounts = member.Payments.ToDictionary(p => p.Id.ToString(), p => p.PaymentAmount);
                    
                    Console.WriteLine($"Update Handler - Existing Payment Amounts:");
                    foreach (var kvp in existingPaymentAmounts)
                    {
                        Console.WriteLine($"  Payment {kvp.Key}: {kvp.Value}");
                    }
                    
                    Console.WriteLine($"Update Handler - Incoming Payment DTOs:");
                    foreach (var dto in request.MemberDto.Payments)
                    {
                        Console.WriteLine($"  Payment {dto.Id}: Amount={dto.Amount}, PaymentDate={dto.PaymentDate}, PaymentType={dto.PaymentType}");
                    }
                    
                    EntityUpdater.UpdateMemberNavigation(member.Payments, request.MemberDto.Payments, _mapper, id => id);
                    
                    // Set MemberId for all payments (in case new ones were added)
                    // Also preserve existing dates and amounts if the mapped values are invalid
                    foreach (var pmt in member.Payments)
                    {
                        if (string.IsNullOrEmpty(pmt.MemberId))
                            pmt.MemberId = member.Id;
                        
                        var paymentIdStr = pmt.Id.ToString();
                        
                        // If the payment date is MinValue (invalid/missing), preserve the existing date
                        if (pmt.PaymentDate == DateTime.MinValue && existingPaymentDates.TryGetValue(paymentIdStr, out var existingDate))
                        {
                            Console.WriteLine($"Preserving existing date for payment {paymentIdStr}: {existingDate}");
                            pmt.PaymentDate = existingDate;
                        }
                        
                        // If the payment amount is 0 and it's an existing payment, preserve the existing amount
                        // Only preserve if it's an existing payment (has an ID in our dictionary)
                        if (pmt.PaymentAmount == 0 && existingPaymentAmounts.TryGetValue(paymentIdStr, out var existingAmount) && existingAmount > 0)
                        {
                            Console.WriteLine($"Preserving existing amount for payment {paymentIdStr}: {existingAmount} (mapped amount was 0)");
                            pmt.PaymentAmount = existingAmount;
                        }
                        else
                        {
                            Console.WriteLine($"Payment {paymentIdStr} - Amount: {pmt.PaymentAmount} (IsExisting: {existingPaymentAmounts.ContainsKey(paymentIdStr)})");
                        }
                    }
                }
                if (request.MemberDto.Incidents != null)
                {
                    // Store existing incident dates before mapping to preserve them if new date is invalid
                    var existingIncidentDates = member.Incidents.ToDictionary(p => p.Id.ToString(), p => p.IncidentDate);
                    
                    // Create a map of DTO IDs to their date strings for fallback
                    // Always prefer PaymentDate, only use IncidentDate if PaymentDate is empty or MinValue
                    var dtoDateMap = request.MemberDto.Incidents.ToDictionary(
                        dto => dto.Id ?? string.Empty, 
                        dto => {
                            // Use PaymentDate if it's valid and not MinValue
                            if (!string.IsNullOrWhiteSpace(dto.PaymentDate) && 
                                dto.PaymentDate != "0001-01-01" && 
                                dto.PaymentDate != DateTime.MinValue.ToString("yyyy-MM-dd"))
                            {
                                return dto.PaymentDate;
                            }
                            // Fall back to IncidentDate only if it's valid and not MinValue
                            if (!string.IsNullOrWhiteSpace(dto.IncidentDate) && 
                                dto.IncidentDate != "0001-01-01" && 
                                dto.IncidentDate != DateTime.MinValue.ToString("yyyy-MM-dd"))
                            {
                                return dto.IncidentDate;
                            }
                            return string.Empty;
                        }
                    );
                    
                    Console.WriteLine($"Update Handler - Existing Incident Dates:");
                    foreach (var kvp in existingIncidentDates)
                    {
                        Console.WriteLine($"  Incident {kvp.Key}: {kvp.Value}");
                    }
                    
                    Console.WriteLine($"Update Handler - Incoming Incident DTOs:");
                    foreach (var dto in request.MemberDto.Incidents)
                    {
                        Console.WriteLine($"  Incident {dto.Id}: IncidentDate={dto.IncidentDate}, PaymentDate={dto.PaymentDate}");
                    }
                    
                    EntityUpdater.UpdateMemberNavigation(member.Incidents, request.MemberDto.Incidents, _mapper, id => id);
                    
                    // Set MemberId for all incidents (in case new ones were added)
                    // Also preserve existing dates if the mapped date is MinValue (invalid/missing)
                    foreach (var inc in member.Incidents)
                    {
                        if (string.IsNullOrEmpty(inc.MemberId))
                            inc.MemberId = member.Id;
                        
                        // Check if this is an existing incident (has an ID that exists in our dictionary)
                        var incidentIdStr = inc.Id.ToString();
                        bool isExistingIncident = existingIncidentDates.ContainsKey(incidentIdStr);
                        
                        // If the incident date is MinValue (invalid/missing)
                        if (inc.IncidentDate == DateTime.MinValue)
                        {
                            if (isExistingIncident && existingIncidentDates.TryGetValue(incidentIdStr, out var existingDate))
                            {
                                // For existing incidents, preserve the original date
                                Console.WriteLine($"Preserving existing date for incident {incidentIdStr}: {existingDate}");
                                inc.IncidentDate = existingDate;
                            }
                            else
                            {
                                // For new incidents, try to parse the date from the DTO if it was sent
                                if (dtoDateMap.TryGetValue(incidentIdStr, out var dtoDateStr) && !string.IsNullOrWhiteSpace(dtoDateStr))
                                {
                                    // Try to parse the date string directly
                                    if (DateTime.TryParseExact(dtoDateStr, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var parsedDate))
                                    {
                                        Console.WriteLine($"Parsing date for new incident {incidentIdStr} from DTO: {dtoDateStr} -> {parsedDate}");
                                        inc.IncidentDate = parsedDate;
                                    }
                                    else if (DateTime.TryParse(dtoDateStr, out var parsedDate2))
                                    {
                                        Console.WriteLine($"Parsing date for new incident {incidentIdStr} from DTO (flexible): {dtoDateStr} -> {parsedDate2}");
                                        inc.IncidentDate = parsedDate2;
                                    }
                                    else
                                    {
                                        Console.WriteLine($"Warning: Could not parse date '{dtoDateStr}' for new incident {incidentIdStr}");
                                    }
                                }
                                else
                                {
                                    Console.WriteLine($"Warning: Incident {incidentIdStr} has MinValue date and no date in DTO. IsExisting: {isExistingIncident}");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"Incident {incidentIdStr} has valid date: {inc.IncidentDate}");
                        }
                    }
                }

                try
                {
                    // Mark entity as modified
                    _context.Update(member);

                    // Save all changes in one transaction
                    await _context.SaveChangesAsync(cancellationToken);

                    // Return updated DTO
                    var updatedDto = _mapper.Map<MemberDto>(member);
                    return Result<MemberDto>.Success(updatedDto);
                }
                catch (Exception ex)
                {
                    return Result<MemberDto>.Failure($"Update failed: {ex.Message}");
                }
            }
        }
    }
}
