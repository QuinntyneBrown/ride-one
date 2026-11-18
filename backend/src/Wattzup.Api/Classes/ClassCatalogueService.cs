using Microsoft.Extensions.Options;
using Wattzup.Core.Classes;

namespace Wattzup.Api.Classes;

/// <summary>
/// Loads the class catalogue file named by <see cref="ClassesOptions"/> into the <see cref="ClassCatalogueStore"/>.
/// A missing or unusable file leaves the catalogue empty and the backend starts as usual (L2-077 criterion 5).
/// </summary>
public sealed partial class ClassCatalogueService(
    ClassCatalogueStore store,
    IOptions<ClassesOptions> options,
    IHostEnvironment environment,
    ILogger<ClassCatalogueService> logger) : IHostedService
{
    /// <summary>The catalogue file's full path: the setting, resolved against the content root when relative.</summary>
    public string FilePath { get; } = Path.GetFullPath(Path.Combine(environment.ContentRootPath, options.Value.Path));

    public Task StartAsync(CancellationToken cancellationToken)
    {
        Load();
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>Reads the file; replaces the catalogue on success and keeps the current one when the file is unusable.</summary>
    public void Load()
    {
        CatalogueLoadResult result;
        try
        {
            using var file = File.OpenRead(FilePath);
            result = ClassCatalogueReader.Read(file, file.Length);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            result = new CatalogueLoadResult(null, [], e is FileNotFoundException or DirectoryNotFoundException ? "the file is missing" : "the file cannot be read");
        }

        if (result.Catalogue is null)
        {
            LogFileError(FilePath, result.FileError ?? "unknown");
            return;
        }

        foreach (var problem in result.Problems)
        {
            LogEntryLeftOut(problem.Entry, problem.Field, problem.Message);
        }

        store.Replace(result.Catalogue);
        LogLoaded(result.Catalogue.Classes.Count, result.Catalogue.Shelves.Count, FilePath);
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Couldn't read the class catalogue {Path}: {Reason}")]
    private partial void LogFileError(string path, string reason);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Class catalogue: left out {Entry} ({Field}): {Reason}")]
    private partial void LogEntryLeftOut(string entry, string field, string reason);

    [LoggerMessage(Level = LogLevel.Information, Message = "Class catalogue: {Classes} classes on {Shelves} shelves from {Path}")]
    private partial void LogLoaded(int classes, int shelves, string path);
}
