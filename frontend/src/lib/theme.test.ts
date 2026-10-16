import { matches } from '@/components/command-palette';
import { buildColumns } from '@/components/tasks/board-columns';
import { isTypingTarget } from '@/hooks/use-hotkeys';
import { isAccent, isThemeMode, resolveDark, themeBootScript } from './theme';

describe('theme', () => {
  it('resolves dark mode from the preference and the OS setting', () => {
    expect(resolveDark('dark', false)).toBe(true);
    expect(resolveDark('light', true)).toBe(false);
    expect(resolveDark('system', true)).toBe(true);
    expect(resolveDark('system', false)).toBe(false);
  });

  it('rejects unknown stored values', () => {
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('neon')).toBe(false);
    expect(isAccent('emerald')).toBe(true);
    expect(isAccent('<script>')).toBe(false);
  });

  it('boot script applies the stored theme before React hydrates', () => {
    localStorage.setItem('taskflow:theme', 'dark');
    localStorage.setItem('taskflow:accent', 'rose');
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;
    new Function(themeBootScript)();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-accent')).toBe('rose');
  });
});

describe('command palette matching', () => {
  it('matches every word, in any order, case-insensitively', () => {
    expect(matches('Go to Projects', 'proj')).toBe(true);
    expect(matches('Create project', 'project create')).toBe(true);
    expect(matches('Create task', 'project')).toBe(false);
  });
});

describe('keyboard shortcuts', () => {
  it('ignores single-key shortcuts while the user is typing', () => {
    expect(isTypingTarget(document.createElement('input'))).toBe(true);
    expect(isTypingTarget(document.createElement('textarea'))).toBe(true);
    expect(isTypingTarget(document.createElement('button'))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe('board columns', () => {
  it('maps each grouping to the field a drop should change', () => {
    expect(buildColumns('status').map((c) => c.patch)).toEqual([
      { status: 'TODO' },
      { status: 'IN_PROGRESS' },
      { status: 'DONE' },
    ]);
    expect(buildColumns('priority').map((c) => c.patch)).toEqual([
      { priority: 'HIGH' },
      { priority: 'MEDIUM' },
      { priority: 'LOW' },
    ]);
    expect(buildColumns('project', { projects: [{ id: 'p1', name: 'A', color: 'blue' }] })[0].patch).toEqual({
      projectId: 'p1',
    });
  });

  it('keeps status columns in workflow order regardless of filter order', () => {
    expect(buildColumns('status', { statuses: ['DONE', 'TODO'] }).map((c) => c.key)).toEqual(['TODO', 'DONE']);
  });
});
