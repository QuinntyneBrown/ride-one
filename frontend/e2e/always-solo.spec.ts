// Acceptance test
// Traces to: L1 (left out: group classes, the multiplayer service); ADR 0038
// Description: a class is always ridden solo. Class Start has no choice between riding alone and with a group, only Start class; and an address that names
// a group session, `/classes/:id/ride?session=…`, rides the class solo, with Pause, no board, no request about a group
// session and no hub connection.
import { connectBike } from './fixtures/class-ride';
import { catalogue, hiitCardio } from './fixtures/classes';
import { echelonBike } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { ClassStartPage } from './pages/class-start.page';
import { WorldLoadingPage } from './pages/world-loading.page';

test.describe('Always solo', () => {
  test('Class Start offers no group session (ADR 0038) @critical', async ({
    page,
    api,
    bluetooth,
  }) => {
    await bluetooth.remember(echelonBike);
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.title).toHaveText('30 Minute HIIT Cardio');
    await expect(start.start).toBeVisible();
    await expect(start.choice).toHaveCount(0);
    await expect(start.join).toHaveCount(0);
    expect(api.requests().filter((request) => request.includes('/sessions'))).toEqual([]);
  });

  test('an address with ?session= rides the class solo and opens no hub connection (ADR 0038)', async ({
    page,
    api,
    bluetooth,
    webgl,
  }) => {
    const asked: string[] = [];
    page.on('request', (request) => asked.push(new URL(request.url()).pathname));
    api.answer('GET', '/api/classes', catalogue);
    await webgl.disable();
    await bluetooth.remember(echelonBike);
    const ride = new ClassRidePage(page);
    await ride.openWithSession(hiitCardio.id, 'hiit-cardio-30-1939');

    const loading = new WorldLoadingPage(page);
    await expect(loading.eyebrow).toContainText('Solo');
    await connectBike(bluetooth);
    await loading.startRiding();

    await expect(ride.name).toHaveText('30 Minute HIIT Cardio · Solo');
    await expect(ride.pause).toBeVisible();
    await expect(ride.board).toHaveCount(0);
    expect(asked.filter((path) => path.startsWith('/hubs/') || path.includes('/sessions'))).toEqual(
      [],
    );
  });
});
