using System.Globalization;
using System.Text;

namespace Wattzup.Core.Telemetry;

/// <summary>An append-only text file that rotates to <c>.1</c>, <c>.2</c>… at <c>maxBytes</c>, keeping <c>retainedFiles</c> old files (L2-030).</summary>
public sealed class RollingFile(string path, long maxBytes, int retainedFiles) : IDisposable
{
    private StreamWriter? _writer;
    private long _length;

    public void WriteLine(string line)
    {
        ArgumentNullException.ThrowIfNull(line);
        var writer = _writer ??= Open();
        var bytes = Encoding.UTF8.GetByteCount(line) + 1;
        if (_length > 0 && _length + bytes > maxBytes)
        {
            Rotate();
            writer = _writer = Open();
        }

        writer.Write(line);
        writer.Write('\n');
        _length += bytes;
    }

    public void Flush() => _writer?.Flush();

    public void Dispose()
    {
        _writer?.Dispose();
        _writer = null;
    }

    private StreamWriter Open()
    {
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        var stream = new FileStream(path, FileMode.Append, FileAccess.Write, FileShare.ReadWrite | FileShare.Delete);
        _length = stream.Length;
        return new StreamWriter(stream, new UTF8Encoding(false)) { AutoFlush = false };
    }

    private string Numbered(int n) => string.Create(CultureInfo.InvariantCulture, $"{path}.{n}");

    private void Rotate()
    {
        _writer?.Dispose();
        _writer = null;
        if (File.Exists(Numbered(retainedFiles)))
        {
            File.Delete(Numbered(retainedFiles));
        }

        for (var n = retainedFiles - 1; n >= 1; n--)
        {
            if (File.Exists(Numbered(n)))
            {
                File.Move(Numbered(n), Numbered(n + 1), overwrite: true);
            }
        }

        if (retainedFiles >= 1)
        {
            File.Move(path, Numbered(1), overwrite: true);
        }
        else
        {
            File.Delete(path);
        }
    }
}
