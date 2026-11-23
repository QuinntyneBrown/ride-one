// Acceptance test
// Traces to: L2-132 AC3, AC4
// Description: a browser asks for liveness, readiness and an unknown backend address, each with a query string. Every span, metric point
// and log record the API writes on the way, at its configured levels, is kept; none carries the query string, and a
// route is recorded as its template, never as the address asked for.
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Telo.Ride.Api.Tests;

public sealed class PrivateTelemetryTests(PrivateTelemetryApi api) : IClassFixture<PrivateTelemetryApi>
{
    private const string Query = "whisper=hush-hush";

    private static CancellationToken Cancel => TestContext.Current.CancellationToken;

    [Fact]
    [Trait("Category", "Critical")]
    public async Task Asking_the_backend_leaves_no_query_string_in_telemetry_and_a_route_is_its_template()
    {
        using var browser = api.CreateClient();
        using (var live = await browser.GetAsync($"/health/live?{Query}", Cancel)) Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        using (var ready = await browser.GetAsync($"/health/ready?{Query}", Cancel)) Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        using (var missing = await browser.GetAsync($"/api/no-such-class?{Query}", Cancel)) Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);

        await api.Spans.Await(span => span.GetTagItem("http.response.status_code") is 404, TimeSpan.FromSeconds(5));
        api.FlushMetrics();
        var written = api.Written().ToList();

        Assert.NotEmpty(written);
        Assert.DoesNotContain(written, text => text.Contains("hush-hush", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(written, text => text.Contains("no-such-class", StringComparison.Ordinal) && text.StartsWith("http.route", StringComparison.Ordinal));
        Assert.Contains(written, text => text == "http.route=api/{**rest}");
        Assert.Contains(written, text => text.Contains("not_found", StringComparison.Ordinal));
    }
}

/// <summary>The API with every span, metric point and log record it writes kept in memory.</summary>
public sealed class PrivateTelemetryApi : TeloRideApiFactory
{
    private readonly ConcurrentQueue<Activity> spans = new();
    private readonly List<Metric> metrics = [];
    private readonly LogRecorder logs = new();

    public EventProbe<Activity> Spans { get; } = new(span => span.DisplayName);

    protected override void ConfigureServices(IServiceCollection services)
    {
        services.ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddProcessor(new Recorder(span =>
        {
            spans.Enqueue(span);
            Spans.Record(span);
        })));
        services.ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddInMemoryExporter(this.metrics));
        services.AddLogging(logging => logging.AddProvider(logs));
    }

    public void FlushMetrics() => Services.GetRequiredService<MeterProvider>().ForceFlush();

    /// <summary>Every name, tag, event, attribute and message telemetry wrote, as text.</summary>
    public IEnumerable<string> Written()
    {
        foreach (var span in spans)
        {
            yield return span.DisplayName;
            yield return span.OperationName;
            foreach (var tag in span.TagObjects) yield return $"{tag.Key}={tag.Value}";
            foreach (var spanEvent in span.Events)
            {
                yield return spanEvent.Name;
                foreach (var tag in spanEvent.Tags) yield return $"{tag.Key}={tag.Value}";
            }
        }

        foreach (var metric in metrics)
        {
            foreach (var point in metric.GetMetricPoints())
            {
                foreach (var tag in point.Tags) yield return $"{metric.Name} {tag.Key}={tag.Value}";
            }
        }

        foreach (var line in logs.Lines) yield return line;
    }

    private sealed class Recorder(Action<Activity> ended) : BaseProcessor<Activity>
    {
        public override void OnEnd(Activity data) => ended(data);
    }

    /// <summary>Keeps each log record the API writes at its configured levels: its message, its values and its scopes.</summary>
    private sealed class LogRecorder : ILoggerProvider, ISupportExternalScope
    {
        private IExternalScopeProvider scopes = new LoggerExternalScopeProvider();

        public ConcurrentQueue<string> Lines { get; } = new();

        public ILogger CreateLogger(string categoryName) => new Logger(this, categoryName);

        public void SetScopeProvider(IExternalScopeProvider scopeProvider) => scopes = scopeProvider;

        public void Dispose()
        {
        }

        private sealed class Logger(LogRecorder recorder, string category) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state)
                where TState : notnull => recorder.scopes.Push(state);

            public bool IsEnabled(LogLevel logLevel) => logLevel != LogLevel.None;

            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                recorder.Lines.Enqueue($"{category}: {formatter(state, exception)} {exception}");
                if (state is IEnumerable<KeyValuePair<string, object?>> values)
                {
                    foreach (var (key, value) in values) recorder.Lines.Enqueue($"{category}: {key}={value}");
                }

                recorder.scopes.ForEachScope((scope, lines) => lines.Enqueue($"{category} scope: {scope}"), recorder.Lines);
            }
        }
    }
}
