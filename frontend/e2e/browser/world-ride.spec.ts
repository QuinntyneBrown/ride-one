// Acceptance Test
// Traces to: L2-102 criterion 9, L2-110, L1-017
// Description: In the browser edition a class that names a world is ridden in it: Ride in <world
// name> starts the ride on the connected bike and opens World Ride, which draws the scene from the
// app's own files, with nothing sent off the device.
import { expect, test } from './fixtures/browser-test';
import { BrowserClassesPage } from './pages/browser-classes.page';
import { BrowserRidePage } from './pages/browser-ride.page';
import { BrowserWorldRidePage } from './pages/browser-world-ride.page';

const catalogue = JSON.stringify({
  shelves: [{ id: 'short', title: '20 min', tagline: 'Short and sharp.' }],
  classes: [
    {
      id: 'cathedral',
      title: 'Cathedral Circuit',
      channel: 'Wattzup Studio',
      focus: 'Zone 2',
      description: 'One level, held.',
      shelf: 'short',
      world: 'oldtown',
      plan: { kind: 'flat', level: 12, minutes: 20, cadence: 85 },
    },
  ],
});

test('Ride in Old Town Criterium starts the class and rides it in its world', async ({ page }) => {
  const classes = new BrowserClassesPage(page);
  await classes.serveCatalogue(catalogue);
  const ride = new BrowserRidePage(page);
  await ride.open();
  await ride.connect();
  await expect(ride.statusState).toHaveText('Connected');

  await classes.openLibrary();
  await classes.card('Cathedral Circuit').click();
  await classes.rideIn('Old Town Criterium').click();

  await page.waitForURL(/\/classes\/cathedral\/world$/);
  const world = new BrowserWorldRidePage(page);
  await expect(world.heading).toContainText('Old Town Criterium');
  await expect(world.scene).toBeVisible();
  await expect(world.sceneNotice).toHaveCount(0);
  await expect(world.endButton).toBeEnabled();
});
