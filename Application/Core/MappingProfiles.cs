using Application.Dtos;
using AutoMapper;
using Domain;

 

namespace Application.Core
{
 public class MappingProfiles : Profile
{
    // Helper methods for safe enum and date parsing (instance methods, not local functions)
    private static PaymentType ParsePaymentType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return PaymentType.Cash;
        return Enum.TryParse<PaymentType>(value, true, out var parsedType) ? parsedType : PaymentType.Cash;
    }

    private static PaymentRecurringType ParsePaymentRecurringType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return PaymentRecurringType.Monthly;
        return Enum.TryParse<PaymentRecurringType>(value, true, out var parsedType) 
            ? parsedType 
            : PaymentRecurringType.Monthly;
    }

    private static IncidentType ParseIncidentType(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return IncidentType.NaturalDeath;
        return Enum.TryParse<IncidentType>(value, true, out var parsedType) 
            ? parsedType 
            : IncidentType.NaturalDeath;
    }

    private static DateTime ParseDate(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DateTime.MinValue; // Use MinValue to indicate missing date, don't default to Today
        // Try parsing with common date formats
        if (DateTime.TryParse(value, out var parsedDate))
            return parsedDate;
        // Try parsing ISO format (yyyy-MM-dd) which is what the frontend sends
        if (DateTime.TryParseExact(value, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var isoDate))
            return isoDate;
        // If all parsing fails, return MinValue instead of Today to avoid changing dates unexpectedly
        return DateTime.MinValue;
    }

    public MappingProfiles()
    {
        // ---------------------------------------
        // Member → MemberDto / MemberDetailsDto (READ)
        // ---------------------------------------
        CreateMap<Member, MemberDto>()
            .ForMember(dest => dest.UserName,
                opt => opt.MapFrom(src => $"{src.FirstName}_{src.LastName}"))
            .ForMember(dest => dest.Bio,
                opt => opt.MapFrom(src => $"Member since {src.RegisterDate}"))
            .ForMember(dest => dest.RegisterDate, opt => opt.MapFrom(src => src.RegisterDate))
            .ForMember(dest => dest.Addresses, opt => opt.MapFrom(src => src.Addresses))
            .ForMember(dest => dest.FamilyMembers, opt => opt.MapFrom(src => src.FamilyMembers))
            .ForMember(dest => dest.Payments, opt => opt.MapFrom(src => src.Payments))
            .ForMember(dest => dest.Incidents, opt => opt.MapFrom(src => src.Incidents))
            .ForMember(dest => dest.MemberFiles, opt => opt.MapFrom(src => src.MemberFiles));

        CreateMap<Member, MemberDetailsDto>()
            .ForMember(dest => dest.RegisterDate, opt => opt.MapFrom(src => src.RegisterDate));

        CreateMap<Member, MemberListDto>();

        // ---------------------------------------
        // MemberDto → Member (UPDATE/CREATE)
        // ---------------------------------------
        var memberMap = CreateMap<MemberDto, Member>();

        memberMap.ForAllMembers(opt =>
            opt.Condition((src, dest, srcMember, destMember) =>
            {
                if (srcMember == null) return false;
                if (srcMember is string s && string.IsNullOrWhiteSpace(s)) return false;
                return true;
            }));

        memberMap.ForMember(m => m.Id, opt => opt.Ignore())
                 .ForMember(m => m.Addresses, opt => opt.Ignore())
                 .ForMember(m => m.FamilyMembers, opt => opt.Ignore())
                 .ForMember(m => m.MemberFiles, opt => opt.Ignore())
                 .ForMember(m => m.Payments, opt => opt.Ignore())
                 .ForMember(m => m.Incidents, opt => opt.Ignore());

        // ---------------------------------------
        // Address ↔ AddressDto
        // ---------------------------------------
        CreateMap<Address, AddressDto>().ReverseMap()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.MemberId, opt => opt.Ignore())
            .ForMember(dest => dest.Member, opt => opt.Ignore());

        // ---------------------------------------
        // FamilyMember ↔ FamilyMemberDto
        // ---------------------------------------
        CreateMap<FamilyMember, FamilyMemberDto>().ReverseMap()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.MemberId, opt => opt.Ignore())
            .ForMember(dest => dest.Member, opt => opt.Ignore());

        // ---------------------------------------
        // Payment ↔ PaymentDto
        // ---------------------------------------
        CreateMap<Payment, PaymentDto>()
            .ForMember(dest => dest.Amount, opt => opt.MapFrom(src => src.PaymentAmount))
            .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => src.PaymentDate.ToString("yyyy-MM-dd")))
            .ForMember(dest => dest.PaymentType, opt => opt.MapFrom(src => src.PaymentType.ToString()))
            .ForMember(dest => dest.PaymentRecurringType, opt => opt.MapFrom(src => src.PaymentRecurringType.ToString()))
            .ReverseMap()
            .ForMember(dest => dest.PaymentAmount, opt => opt.MapFrom(src => src.Amount))
            .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => ParseDate(src.PaymentDate)))
            .ForMember(dest => dest.PaymentType, opt => opt.MapFrom(src => ParsePaymentType(src.PaymentType)))
            .ForMember(dest => dest.PaymentRecurringType, opt => opt.MapFrom(src => ParsePaymentRecurringType(src.PaymentRecurringType)))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.MemberId, opt => opt.Ignore())
            .ForMember(dest => dest.Member, opt => opt.Ignore());

        // ---------------------------------------
        // Incident ↔ IncidentDto
        // ---------------------------------------
        CreateMap<Incident, IncidentDto>()
            .ForMember(dest => dest.IncidentType, opt => opt.MapFrom(src => src.IncidentType.ToString()))
            .ForMember(dest => dest.IncidentDate, opt => opt.MapFrom(src => src.IncidentDate.ToString("yyyy-MM-dd")))
            .ForMember(dest => dest.PaymentDate, opt => opt.MapFrom(src => src.IncidentDate.ToString("yyyy-MM-dd"))) // Map to PaymentDate for backward compatibility
            .ReverseMap()
            .ForMember(dest => dest.IncidentType, opt => opt.MapFrom(src => ParseIncidentType(src.IncidentType)))
            .ForMember(dest => dest.IncidentDate, opt => opt.MapFrom(src => {
                // ALWAYS use PaymentDate - this is the field that holds the actual value from the frontend
                // The frontend form uses "paymentDate" field, so PaymentDate in the DTO contains the real date
                // We should NEVER use IncidentDate from the DTO - it's just for backward compatibility
                
                string dateStr = src.PaymentDate ?? string.Empty;
                
                Console.WriteLine($"Mapping Incident Date - PaymentDate: '{src.PaymentDate}', IncidentDate (from DTO): '{src.IncidentDate}'");
                
                // Check if PaymentDate has a valid value (not empty, not MinValue)
                if (string.IsNullOrWhiteSpace(dateStr) || 
                    dateStr == "0001-01-01" || 
                    dateStr == DateTime.MinValue.ToString("yyyy-MM-dd"))
                {
                    Console.WriteLine($"  -> PaymentDate is invalid/empty, returning MinValue");
                    return DateTime.MinValue;
                }
                
                // Try multiple parsing strategies
                DateTime parsedDate;
                
                // First try ISO format (yyyy-MM-dd) which is what date inputs send
                if (DateTime.TryParseExact(dateStr, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out parsedDate))
                {
                    Console.WriteLine($"  -> Parsed PaymentDate '{dateStr}' (ISO) to: {parsedDate}");
                    return parsedDate;
                }
                
                // Try flexible parsing
                if (DateTime.TryParse(dateStr, out parsedDate))
                {
                    Console.WriteLine($"  -> Parsed PaymentDate '{dateStr}' (flexible) to: {parsedDate}");
                    return parsedDate;
                }
                
                // If all parsing fails, return MinValue
                Console.WriteLine($"  -> Failed to parse PaymentDate '{dateStr}', returning MinValue");
                return DateTime.MinValue;
            }))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.MemberId, opt => opt.Ignore())
            .ForMember(dest => dest.Member, opt => opt.Ignore());

        // ---------------------------------------
        // MemberFile ↔ MemberFileDto
        // ---------------------------------------
        CreateMap<MemberFile, MemberFileDto>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id.ToString()))
            .ForMember(dest => dest.Base64FileData, opt => opt.MapFrom(src => Convert.ToBase64String(src.ImageData)))
            .ForMember(dest => dest.FilePath, opt => opt.Ignore()) // Not in domain model
            .ForMember(dest => dest.FileType, opt => opt.Ignore()) // Not in domain model
            .ReverseMap()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => string.IsNullOrEmpty(src.Id) ? Guid.NewGuid() : Guid.Parse(src.Id)))
            .ForMember(dest => dest.ImageData, opt => opt.MapFrom(src => src.ImageData ?? Array.Empty<byte>()))
            .ForMember(dest => dest.MemberId, opt => opt.Ignore())
            .ForMember(dest => dest.Member, opt => opt.Ignore());
    }
}


}

