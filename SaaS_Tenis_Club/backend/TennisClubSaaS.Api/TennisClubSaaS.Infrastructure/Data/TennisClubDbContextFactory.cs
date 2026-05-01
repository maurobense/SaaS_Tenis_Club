using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace TennisClubSaaS.Infrastructure.Data;

public class TennisClubDbContextFactory : IDesignTimeDbContextFactory<TennisClubDbContext>
{
    public TennisClubDbContext CreateDbContext(string[] args)
    {
        var current = Directory.GetCurrentDirectory();
        var candidates = new[]
        {
            Path.Combine(current, "TennisClubSaaS.Api"),
            Path.Combine(current, "..", "TennisClubSaaS.Api"),
            Path.Combine(current, "..", "..", "TennisClubSaaS.Api")
        };
        var basePath = candidates
            .Select(Path.GetFullPath)
            .First(path => File.Exists(Path.Combine(path, "appsettings.json")));
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var options = new DbContextOptionsBuilder<TennisClubDbContext>()
            .UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
            .Options;

        return new TennisClubDbContext(options);
    }
}
