using System.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;

namespace Telo.Ride.Api.Tests;

/// <summary>The signed-in probe API with its spans and metrics exported to memory.</summary>
public sealed class TelemetryApi : SignedInProbeApi
{
    public SpanRecorder Spans { get; } = new();

    public List<Metric> Metrics { get; } = [];

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.ConfigureOpenTelemetryTracerProvider(tracing => tracing.AddProcessor(Spans));
        services.ConfigureOpenTelemetryMeterProvider(metrics => metrics.AddInMemoryExporter(Metrics));
    }

    /// <summary>Exports the metrics recorded so far into <see cref="Metrics"/>.</summary>
    public void FlushMetrics() => Services.GetRequiredService<MeterProvider>().ForceFlush();
}

/// <summary>Records each finished span, and lets a test await one with a timeout instead of sleeping.</summary>
public sealed class SpanRecorder : BaseProcessor<Activity>
{
    private readonly List<Activity> ended = [];
    private readonly Lock gate = new();
    private TaskCompletionSource signal = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public override void OnEnd(Activity data)
    {
        lock (gate)
        {
            ended.Add(data);
            signal.TrySetResult();
            signal = new(TaskCreationOptions.RunContinuationsAsynchronously);
        }
    }

    /// <summary>The first finished span matching <paramref name="match"/>, or a failure naming the spans that did end.</summary>
    public async Task<Activity> Await(Func<Activity, bool> match, TimeSpan timeout)
    {
        using var deadline = new CancellationTokenSource(timeout);
        while (true)
        {
            Task next;
            lock (gate)
            {
                var found = ended.FirstOrDefault(match);
                if (found is not null)
                {
                    return found;
                }

                next = signal.Task;
            }

            try
            {
                await next.WaitAsync(deadline.Token);
            }
            catch (OperationCanceledException)
            {
                string seen;
                lock (gate)
                {
                    seen = string.Join(", ", ended.Select(span => span.DisplayName));
                }

                throw new TimeoutException($"No matching span within {timeout}; spans that ended: [{seen}]");
            }
        }
    }
}
