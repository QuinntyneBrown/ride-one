// Reads classes.json by the rules and limits
// of L2-077, keeping valid shelves and classes in file order and naming each one left out
// (L2-096 AC2).
import type { WorkoutPlan, WorldId } from '@wattzup/api';
import { validatePlan } from './workout-plan-validator';

export const MAX_BYTES = 1024 * 1024;
export const MAX_SHELVES = 20;
export const MAX_CLASSES = 200;
/** The scenes built into the app, as ClassWorlds.Ids in the backend (L2-100). */
export const WORLDS: readonly WorldId[] = [
  'docklands',
  'granite',
  'oldtown',
  'prairie',
  'dolomites',
  'coast',
  'caribana',
  'westminster',
  'centralpark',
  'southbeach',
  'ghent',
  'blackpool',
  'suburbia',
  'nottinghill',
  'knicks',
  'vegas',
  'route66',
  'venice',
  'amsterdam',
  'giza',
];

export interface Shelf {
  id: string;
  title: string;
  tagline: string;
}

export interface CatalogueClass {
  id: string;
  title: string;
  channel: string;
  focus: string;
  description: string;
  shelfId: string;
  plan: WorkoutPlan;
  world: WorldId | null;
}

export interface Catalogue {
  shelves: Shelf[];
  classes: CatalogueClass[];
}

export interface CatalogueEntryProblem {
  entry: string;
  field: string;
  message: string;
}

export interface CatalogueLoadResult {
  catalogue: Catalogue | null;
  problems: CatalogueEntryProblem[];
  fileError: string | null;
}

type Json = Record<string, unknown>;
const ID = /^[a-z0-9-]{1,64}$/;
const TEXT_RULES: readonly [string, number, number][] = [
  ['title', 1, 80],
  ['channel', 1, 40],
  ['focus', 1, 40],
  ['description', 0, 280],
];

export const isClassId = (id: unknown): id is string => typeof id === 'string' && ID.test(id);
const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (entry: unknown, name: string): string | null =>
  isObject(entry) && typeof entry[name] === 'string' ? entry[name] : null;
/** Characters, not UTF-16 units, as .NET's runes. */
const fits = (value: string | null, min: number, max: number) =>
  value !== null && [...value].length >= min && [...value].length <= max;

function rule(field: string): string {
  switch (field) {
    case 'id':
      return 'An id is 1 to 64 characters of a-z, 0-9 and -.';
    case 'title':
      return 'A title is 1 to 80 characters.';
    case 'channel':
      return 'A channel is 1 to 40 characters.';
    case 'focus':
      return 'A focus is 1 to 40 characters.';
    case 'tagline':
      return 'A tagline is at most 280 characters.';
    case 'description':
      return 'A description is at most 280 characters.';
    case 'world':
      return 'A world is one of the built-in scene ids.';
    default:
      return 'The field is not valid.';
  }
}

/** Reads the catalogue file's text; `bytes` is its size on the wire. */
export function readCatalogue(
  json: string,
  bytes = new TextEncoder().encode(json).length,
): CatalogueLoadResult {
  if (bytes > MAX_BYTES) return { catalogue: null, problems: [], fileError: 'larger than 1 MB' };
  let root: unknown;
  try {
    root = JSON.parse(json);
  } catch {
    return { catalogue: null, problems: [], fileError: 'not valid JSON' };
  }
  const arrayOrMissing = (name: string) =>
    isObject(root) && (root[name] === undefined || Array.isArray(root[name]));
  if (!isObject(root) || !arrayOrMissing('shelves') || !arrayOrMissing('classes')) {
    return {
      catalogue: null,
      problems: [],
      fileError: 'not a catalogue: shelves and classes must be arrays',
    };
  }
  const problems: CatalogueEntryProblem[] = [];
  const shelves = readShelves((root['shelves'] as unknown[] | undefined) ?? [], problems);
  const classes = readClasses((root['classes'] as unknown[] | undefined) ?? [], shelves, problems);
  return { catalogue: { shelves, classes }, problems, fileError: null };
}

function readShelves(entries: unknown[], problems: CatalogueEntryProblem[]): Shelf[] {
  const shelves: Shelf[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const id = text(entry, 'id');
    const name = isClassId(id) ? id : `shelves[${i}]`;
    const field = !isClassId(id)
      ? 'id'
      : shelves.some((s) => s.id === id)
        ? 'id'
        : !fits(text(entry, 'title'), 1, 80)
          ? 'title'
          : !fits(text(entry, 'tagline'), 0, 280)
            ? 'tagline'
            : null;
    if (field !== null) {
      problems.push({
        entry: name,
        field,
        message:
          field === 'id' && isClassId(name)
            ? "The shelf id repeats an earlier shelf's."
            : rule(field),
      });
      continue;
    }
    if (shelves.length === MAX_SHELVES) {
      problems.push({
        entry: 'shelves',
        field: 'shelves',
        message: `At most ${MAX_SHELVES} shelves: ${entries.length - i} dropped.`,
      });
      break;
    }
    shelves.push({ id: name, title: text(entry, 'title')!, tagline: text(entry, 'tagline')! });
  }
  return shelves;
}

function readClasses(
  entries: unknown[],
  shelves: Shelf[],
  problems: CatalogueEntryProblem[],
): CatalogueClass[] {
  const classes: CatalogueClass[] = [];
  let dropped = 0;
  entries.forEach((entry, i) => {
    const id = text(entry, 'id');
    const name = isClassId(id) ? id : `classes[${i}]`;
    const checked = check(entry, name, classes, shelves);
    if ('problem' in checked) {
      problems.push(checked.problem);
      return;
    }
    if (classes.length === MAX_CLASSES) {
      dropped++;
      return;
    }
    classes.push({
      id: name,
      title: text(entry, 'title')!,
      channel: text(entry, 'channel')!,
      focus: text(entry, 'focus')!,
      description: text(entry, 'description')!,
      shelfId: text(entry, 'shelf')!,
      plan: checked.plan,
      world: checked.world,
    });
  });
  if (dropped > 0) {
    problems.push({
      entry: 'classes',
      field: 'classes',
      message: `At most ${MAX_CLASSES} classes: ${dropped} dropped.`,
    });
  }
  return classes;
}

function check(
  entry: unknown,
  name: string,
  kept: CatalogueClass[],
  shelves: Shelf[],
): { plan: WorkoutPlan; world: WorldId | null } | { problem: CatalogueEntryProblem } {
  const id = text(entry, 'id');
  if (!isClassId(id)) return { problem: { entry: name, field: 'id', message: rule('id') } };
  if (kept.some((c) => c.id === id)) {
    return {
      problem: { entry: name, field: 'id', message: "The class id repeats an earlier class's." },
    };
  }
  for (const [field, min, max] of TEXT_RULES) {
    if (!fits(text(entry, field), min, max))
      return { problem: { entry: name, field, message: rule(field) } };
  }
  if (!shelves.some((s) => s.id === text(entry, 'shelf'))) {
    return {
      problem: { entry: name, field: 'shelf', message: 'The shelf names no shelf in the file.' },
    };
  }
  if (!isObject(entry) || !('plan' in entry)) {
    return { problem: { entry: name, field: 'plan', message: 'A class needs a plan.' } };
  }
  const result = validatePlan(entry['plan']);
  if (!result.plan) {
    const [key, messages] = Object.entries(result.errors)[0];
    return {
      problem: {
        entry: name,
        field: `plan.${key}`,
        message: messages[0] ?? 'The plan is not valid.',
      },
    };
  }
  const world = entry['world'] ?? null;
  if (world !== null && !WORLDS.includes(world as WorldId)) {
    return { problem: { entry: name, field: 'world', message: rule('world') } };
  }
  return { plan: result.plan, world: world as WorldId | null };
}
