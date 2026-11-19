// Copies the backend edition's class catalogue to where the browser edition's build picks it up,
// so the default browser build ships the same classes.json beside index.html (L2-096 AC1).
// Angular copies assets only from inside the workspace, hence this step before each browser build.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(frontend, 'dist', 'browser-assets');
mkdirSync(target, { recursive: true });
copyFileSync(
  join(frontend, '..', 'backend', 'src', 'Wattzup.Api', 'classes.json'),
  join(target, 'classes.json'),
);
