
using System.Text;
using System.Text.Json.Serialization;
using Application.Core;
using Application.MediatR;
using Application.MediatR.Behaviors;
using Application.MediatR.Validators;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });


builder.Services.AddDbContext<AppDbContext>(
    options => options.UseSqlServer(builder.Configuration.GetConnectionString("ECNMembersConnection"), 
    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

builder.Services.AddCors(options =>
           {
               options.AddPolicy("CorsPolicy", policy =>
               {
                   policy.AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials()
                   .WithOrigins("http://localhost:3000", "https://localhost:3000", "http://localhost:5173", "https://localhost:5173");
               });

           });

  builder.Services.AddIdentity<Member, IdentityRole>(opt =>
            {
                opt.Password.RequiredLength = 7;
                opt.Password.RequireNonAlphanumeric = true;
                opt.User.RequireUniqueEmail = true;

            }).AddEntityFrameworkStores<AppDbContext>()
              .AddDefaultTokenProviders();

  // Configure JWT Authentication
  var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
      builder.Configuration["TokenKey"] ?? "super-secret-key-that-should-be-at-least-32-characters-long-for-security"));
  
  builder.Services.AddAuthentication(options =>
      {
          options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
          options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
      })
      .AddJwtBearer(opt =>
      {
          opt.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
          {
              OnChallenge = context =>
              {
                  // Prevent redirects for API endpoints - return 401 instead
                  context.HandleResponse();
                  context.Response.StatusCode = 401;
                  context.Response.ContentType = "application/json";
                  var result = System.Text.Json.JsonSerializer.Serialize(new { error = "Unauthorized" });
                  return context.Response.WriteAsync(result);
              }
          };
          opt.TokenValidationParameters = new TokenValidationParameters
          {
              ValidateIssuerSigningKey = true,
              IssuerSigningKey = key,
              ValidateIssuer = false,
              ValidateAudience = false
          };
      });

  builder.Services.AddAuthorization();

  // Register MediatR
  builder.Services.AddMediatR(x => x.RegisterServicesFromAssemblyContaining<GetMemberList>());
  
  // Register FluentValidation validators
  builder.Services.AddValidatorsFromAssemblyContaining<CreateMemberValidator>();
  
  // Register MediatR pipeline behaviors (order matters - validation first, then logging)
  builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
  builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
  
  builder.Services.AddAutoMapper(typeof(MappingProfiles).Assembly);


    
var app = builder.Build();



app.UseStaticFiles(); // To serve wwwroot

// Serve 'uploads' as static files from the project root
// app.UseStaticFiles(new StaticFileOptions
// {
//     FileProvider = new PhysicalFileProvider(
//         Path.Combine(Directory.GetCurrentDirectory(), "uploads")),
//     RequestPath = "/uploads"
// });

 




// Configure the HTTP request pipeline.

//app.UseHttpsRedirection();

// CORS must be before UseAuthentication and UseAuthorization
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


using var scope = app.Services.CreateScope();
var services = scope.ServiceProvider;

try
{
    var context = services.GetRequiredService<AppDbContext>();//! GIVE US THE DESIRE SERVICE 
    var userManager = services.GetRequiredService<UserManager<Member>>();

    await context.Database.MigrateAsync();//! this will create the database if it does not exist and apply any pending migrations
    await DbInitializer.SeedData(context, userManager);//! and then dotnet watch run
}
catch (Exception ex)
{
    var logger = services.GetRequiredService<ILogger<Program>>();//! GIVE US THE DESIRE SERVICE  again 
    logger.LogError(ex, "An error occurred during migration!");
}



app.Run();



