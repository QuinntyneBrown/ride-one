import { coursePath } from './course-worlds';

describe('coursePath (L2-173 AC9)', () => {
  it('serves Ibiza Sunset Strip as a course built in Blender', () => {
    expect(coursePath('ibiza')).toBe('courses/ibiza');
  });

  it.each([
    'prairie',
    'oldtown',
    'coast',
    'docklands',
    'dolomites',
    'southbeach',
    'granite',
  ] as const)('has no course for %s, which went with the other courses (ADR 0042)', (world) => {
    expect(coursePath(world)).toBeNull();
  });

  it("leaves a world no course rides to main's scenes", () => {
    expect(coursePath('amsterdam')).toBeNull();
  });
});
