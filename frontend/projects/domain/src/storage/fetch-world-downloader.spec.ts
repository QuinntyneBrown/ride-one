// Unit test
// Traces to: L2-152 AC2
// Description: a world without a panorama has nothing to download: no request is made and its size is 0. Telo Ride 1
// ships no panorama (ADR 0042), so this is all the downloader does until the slice that builds L2-175 replaces it; the
// cases that fetched, saved and resumed a panorama went with the panoramas.
import { TestBed } from '@angular/core/testing';
import type { WorldDownloadProgress } from '@telo/api';
import { FetchWorldDownloader } from './fetch-world-downloader';

describe('FetchWorldDownloader', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let downloader: FetchWorldDownloader;
  let seen: WorldDownloadProgress[];
  const progress = (p: WorldDownloadProgress) => seen.push(p);

  beforeEach(() => {
    seen = [];
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    TestBed.configureTestingModule({ providers: [FetchWorldDownloader] });
    downloader = TestBed.inject(FetchWorldDownloader);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has nothing to download for Ibiza Sunset Strip, which has no panorama', async () => {
    await expect(
      downloader.download(
        { id: 'ibiza', name: 'Ibiza Sunset Strip' },
        progress,
        new AbortController().signal,
      ),
    ).resolves.toBe(0);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(seen).toEqual([]);
  });
});
