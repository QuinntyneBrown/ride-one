namespace Wattzup.Core.Sessions;

/// <summary>
/// The single holder of the saved sessions, newest first (L2-082). Changes are made under a short lock and published
/// by reference swap, so readers never lock.
/// </summary>
public sealed class SessionStore
{
    /// <summary>The most sessions kept; older ones are dropped (L2-082 criterion 4).</summary>
    public const int MaxSessions = 500;

    private readonly Lock _gate = new();
    private IReadOnlyList<SessionRecord> _all = [];

    /// <summary>Raised after a session is added, with the whole list to write.</summary>
    public event EventHandler<IReadOnlyList<SessionRecord>>? Saved;

    /// <summary>Every session, newest first.</summary>
    public IReadOnlyList<SessionRecord> All => Volatile.Read(ref _all);

    public SessionRecord? Find(string id) => All.FirstOrDefault(s => s.Id == id);

    /// <summary>Fills the store at start-up, newest first, keeping the newest <see cref="MaxSessions"/>.</summary>
    public void Load(IEnumerable<SessionRecord> sessions)
    {
        lock (_gate)
        {
            Volatile.Write(ref _all, [.. sessions.OrderByDescending(s => s.EndedAt).Take(MaxSessions)]);
        }
    }

    /// <summary>Puts <paramref name="session"/> first, drops the oldest beyond the cap and raises <see cref="Saved"/>.</summary>
    public void Add(SessionRecord session)
    {
        IReadOnlyList<SessionRecord> list;
        lock (_gate)
        {
            list = [session, .. _all.Take(MaxSessions - 1)];
            Volatile.Write(ref _all, list);
        }

        Saved?.Invoke(this, list);
    }

    /// <summary>A fresh 12-character lowercase hex id that no session has.</summary>
    public string NewId()
    {
        while (true)
        {
            var id = System.Security.Cryptography.RandomNumberGenerator.GetHexString(12, lowercase: true);
            if (Find(id) is null)
            {
                return id;
            }
        }
    }
}
