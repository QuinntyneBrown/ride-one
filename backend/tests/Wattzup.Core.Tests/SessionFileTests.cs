// Unit Test
// Traces to: L2-082
// Description: The sessions file is read whole, refused when it is not a sessions file or over 16 MB, written through a
// temporary file that never stays behind, set aside when unreadable, and the store keeps the newest 500.

using Wattzup.Core.Sessions;
using Wattzup.Core.Workouts;

namespace Wattzup.Core.Tests;

public sealed class SessionFileTests : IDisposable
{
    private readonly string _dir = Directory.CreateTempSubdirectory("wattzup-sessions-").FullName;

    private string PathOf(string name) => Path.Combine(_dir, name);

    internal static SessionRecord Session(string id, DateTimeOffset endedAt, string? classId = null, int ridden = 600, int avgPower = 150)
    {
        var plan = new FlatPlan(12, 10, 85);
        var segments = PlanExpander.Expand(plan);
        var samples = Enumerable.Repeat(new RideSample(avgPower, 85), ridden).ToArray();
        var totals = samples.Aggregate(RideTotals.Empty, (t, s) => t.Tick(s.Power, 30));
        return SessionBuilder.Build(new SessionInput(id, endedAt, classId, classId ?? "Flat · Level 12 · 10 min", plan, segments, samples, totals));
    }

    [Fact]
    public void A_missing_file_reads_as_no_sessions()
    {
        var result = SessionFile.Read(PathOf("sessions.json"));

        Assert.Empty(result.Sessions!);
        Assert.Null(result.Error);
    }

    [Fact]
    public void A_written_file_reads_back_the_same_sessions_and_leaves_no_temporary_file()
    {
        var at = new DateTimeOffset(2026, 11, 18, 18, 10, 0, TimeSpan.Zero);
        SessionRecord[] sessions = [Session("aaaaaaaaaaa2", at, "30-minute-hiit-cardio"), Session("aaaaaaaaaaa1", at.AddDays(-1))];

        SessionFile.Write(PathOf("sessions.json"), sessions);
        var back = SessionFile.Read(PathOf("sessions.json")).Sessions!;

        Assert.Equal(["aaaaaaaaaaa2", "aaaaaaaaaaa1"], back.Select(s => s.Id));
        Assert.Equal(sessions[0].Plan, back[0].Plan);
        Assert.Equal(sessions[0].Segments, back[0].Segments);
        Assert.Equal(sessions[0].CadenceTrace, back[0].CadenceTrace);
        Assert.Equal(sessions[0].ToSummary(), back[0].ToSummary());
        Assert.Equal(["sessions.json"], Directory.GetFiles(_dir).Select(Path.GetFileName));
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("[]")]
    [InlineData("{\"other\":[]}")]
    [InlineData("{\"sessions\":[{\"id\":1}]}")]
    public void A_file_that_is_not_a_sessions_file_is_an_error(string content)
    {
        File.WriteAllText(PathOf("sessions.json"), content);

        var result = SessionFile.Read(PathOf("sessions.json"));

        Assert.Null(result.Sessions);
        Assert.NotNull(result.Error);
    }

    [Fact]
    public void A_file_over_16_MB_is_an_error()
    {
        using (var file = File.Create(PathOf("sessions.json")))
        {
            file.SetLength(SessionFile.MaxBytes + 1);
        }

        Assert.Equal("the file is larger than 16 MB", SessionFile.Read(PathOf("sessions.json")).Error);
    }

    [Fact]
    public void Setting_aside_renames_the_file_and_replaces_an_older_unreadable_one()
    {
        File.WriteAllText(PathOf("sessions.json"), "new");
        File.WriteAllText(PathOf("sessions.json.unreadable"), "old");

        SessionFile.SetAside(PathOf("sessions.json"));

        Assert.False(File.Exists(PathOf("sessions.json")));
        Assert.Equal("new", File.ReadAllText(PathOf("sessions.json.unreadable")));
    }

    [Fact]
    public void The_store_keeps_the_newest_500()
    {
        var store = new SessionStore();
        var start = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        store.Load(Enumerable.Range(0, 500).Select(i => Session($"{i:x12}", start.AddHours(i))));

        store.Add(Session("ffffffffffff", start.AddHours(600)));

        Assert.Equal(500, store.All.Count);
        Assert.Equal("ffffffffffff", store.All[0].Id);
        Assert.Null(store.Find($"{0:x12}"));
        Assert.NotNull(store.Find($"{1:x12}"));
    }

    public void Dispose() => Directory.Delete(_dir, recursive: true);
}
