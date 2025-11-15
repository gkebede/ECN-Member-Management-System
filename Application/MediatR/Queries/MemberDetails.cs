using Application.Dtos;
using Application.Core;
using AutoMapper;
using MediatR;
using Persistence;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace Application.MediatR
{
    public class MemberDetails
    {


        // public class Query : IRequest<Result<MemberDto>>
        public class Query : IRequest<Result<MemberDto>>
        {
            public required Guid Id { get; set; }
            // Add the missing type definition
        }
        public class Handler : IRequestHandler<Query, Result<MemberDto>>
        {
            private readonly AppDbContext _context;
            private readonly IMapper _mapper;
            public Handler(AppDbContext context, IMapper mapper)
            {
                _mapper = mapper;
                _context = context;
            }
            public async Task<Result<MemberDto>> Handle(Query request, CancellationToken cancellationToken)
            {
                // Load member with all related data using Include (not ProjectTo)
                // ProjectTo cannot execute Convert.ToBase64String in SQL, so we need to map after fetching
                var member = await _context.Members
                    .Include(m => m.Addresses)
                    .Include(m => m.FamilyMembers)
                    .Include(m => m.MemberFiles)
                    .Include(m => m.Payments)
                    .Include(m => m.Incidents)
                    .AsSplitQuery()
                    .FirstOrDefaultAsync(m => m.Id == request.Id.ToString(), cancellationToken);

                if (member == null)
                    return Result<MemberDto>.Failure($"No member found with Id: {request.Id}");

                // Map to DTO after fetching (this allows Base64FileData to be computed properly)
                var memberDto = _mapper.Map<MemberDto>(member);

                return Result<MemberDto>.Success(memberDto);
            }
        }
    }
}