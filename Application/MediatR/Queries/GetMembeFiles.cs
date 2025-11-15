using Application.Core;
using Application.Dtos;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.MediatR.Queries
{
    // Get single file  || get multiple files
    public class GetMembeFiles
    {
        public class Query : IRequest<Result<List<MemberFileDto>>>
        {
            public required Guid Id { get; set; }

        }

        public class Handler : IRequestHandler<Query, Result<List<MemberFileDto>>>
        {
            private readonly AppDbContext _context;
            private readonly IMapper _mapper;
            public Handler(AppDbContext context, IMapper mapper)
            {
                _mapper = mapper;
                _context = context;
            }
            public async Task<Result<List<MemberFileDto>>> Handle(Query request, CancellationToken cancellationToken)
            {
                var files = await _context.MemberFiles
                    .Where(f => f.MemberId == request.Id.ToString())
                    .ProjectTo<MemberFileDto>(_mapper.ConfigurationProvider)
                    .ToListAsync(cancellationToken);



                // Build URLs manually
                files.ForEach(f =>
                {
                    f.FilePath = $"https://localhost:3000/api/files/file/{f.Id}";

                });

                return Result<List<MemberFileDto>>.Success(files);


            }

        }
    }
}