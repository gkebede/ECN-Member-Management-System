

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());

        options.JsonSerializerOptions.ReferenceHandler =ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });


builder.Services.AddDbContext<AppDbContext>(
    options => options.UseSqlServer(builder.Configuration.GetConnectionString("ECNMembersConnection"), 
    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

builder.Services.AddCors(options =>
           {
               options.AddPolicy("CorsPolicy", policy =>
               {
                   //policy.AllowAnyMethod().AllowAnyHeader().WithOrigins("*");
                   policy.AllowAnyMethod().AllowAnyHeader()
                   .WithOrigins("http://localhost:3000");
               });

           });

  builder.Services.AddIdentity<Member, IdentityRole>(opt =>
            {
                opt.Password.RequiredLength = 7;
                opt.Password.RequireNonAlphanumeric = true;
                opt.User.RequireUniqueEmail = true;

            }).AddEntityFrameworkStores<AppDbContext>()
              .AddDefaultTokenProviders();

  builder.Services.AddMediatR(x => x.RegisterServicesFromAssemblyContaining<GetMemberList>());
 // builder.Services.AddMediatR(config => config.RegisterServicesFromAssemblies(typeof(GetMemberList.Handler).Assembly));
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

//app.UseAuthorization();
app.UseCors("CorsPolicy");
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



