// Records real API responses from the backend running with the simulated bike into
// e2e/fixtures/recorded/, so the Playwright stubs keep the backend's exact shapes (AGENTS.md, E2E).
// Recording is never part of a test run. Start the backend first:
//   dotnet run --project backend/src/Wattzup.Api -- --simulate
// then: npm run record:api [-- http://127.0.0.1:8787]
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = process.argv[2] ?? 'http://127.0.0.1:8787';
const out = new URL('../e2e/fixtures/recorded/', import.meta.url);
mkdirSync(out, { recursive: true });

const plan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(method, path, body, contentType = 'application/json') {
  const response = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': contentType },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: response.status, json: await response.json() };
}

function save(name, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${name}: expected ${expectedStatus}, got ${response.status} ${JSON.stringify(response.json)}`,
    );
  }
  writeFileSync(new URL(`${name}.json`, out), JSON.stringify(response.json, null, 2) + '\n');
  console.log(`recorded ${name} (${response.status})`);
}

for (let i = 0; ; i++) {
  const health = await call('GET', '/health').catch(() => null);
  if (health?.json.ble === 'connected') break;
  if (i > 30) throw new Error(`The backend at ${base} is not connected to the simulated bike.`);
  await wait(1000);
}

await call('POST', '/api/workout/stop');
save('status-free-ride', await call('GET', '/api/status'), 200);
save('problem-no-active-workout', await call('POST', '/api/workout/pause'), 409);
save(
  'problem-invalid-workout',
  await call('POST', '/api/workout', { ...plan, work_seconds: 3601 }),
  400,
);
save('problem-invalid-json', await call('POST', '/api/workout', '{"kind":'), 400);
save('problem-invalid-level', await call('POST', '/api/resistance', { level: 33 }), 400);
save(
  'problem-unsupported-media-type',
  await call('POST', '/api/resistance', 'level=12', 'text/plain'),
  415,
);
save('problem-already-connected', await call('POST', '/api/bike/reconnect'), 409);
save('problem-not-found', await call('GET', '/api/nope'), 404);
save('resistance-sent', await call('POST', '/api/resistance', { level: 10 }), 200);
save('workout-started', await call('POST', '/api/workout', plan), 200);
await wait(3500);
save('status-running', await call('GET', '/api/status'), 200);
save('trace', await call('GET', '/api/workout/trace'), 200);
save('workout-paused', await call('POST', '/api/workout/pause'), 200);
save('workout-resumed', await call('POST', '/api/workout/resume'), 200);
save('workout-stopped', await call('POST', '/api/workout/stop'), 200);
save('packets', await call('GET', '/api/diagnostics/packets'), 200);
save('health', await call('GET', '/health'), 200);

execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', new URL('.', out).pathname], {
  stdio: 'inherit',
});
