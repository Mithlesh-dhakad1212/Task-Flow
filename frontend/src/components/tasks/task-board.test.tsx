import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Task } from '@/lib/types';
import { buildColumns, type GroupBy } from './board-columns';
import { TaskBoard } from './task-board';

function task(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    projectId: 'p1',
    project: { id: 'p1', name: 'Website', color: 'blue' },
    title: 'Task',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '2099-01-01',
    isOverdue: false,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const tasks = [
  task({ id: 'a', title: 'Design homepage', status: 'TODO', priority: 'HIGH' }),
  task({ id: 'b', title: 'Implement UI', status: 'IN_PROGRESS' }),
  task({ id: 'c', title: 'Project setup', status: 'DONE', priority: 'LOW', projectId: 'p2', project: { id: 'p2', name: 'Mobile', color: 'violet' } }),
];
const projects = [
  { id: 'p1', name: 'Website', color: 'blue' as const },
  { id: 'p2', name: 'Mobile', color: 'violet' as const },
];

function setup(groupBy: GroupBy = 'status', statuses: Task['status'][] = []) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn(),
    onMove: vi.fn(),
    onQuickAdd: vi.fn().mockResolvedValue(undefined),
  };
  render(<TaskBoard tasks={tasks} columns={buildColumns(groupBy, { statuses, projects })} showProject {...handlers} />);
  return handlers;
}

function dataTransfer() {
  const store: Record<string, string> = {};
  return {
    setData: (k: string, v: string) => (store[k] = v),
    getData: (k: string) => store[k],
    get types() {
      return Object.keys(store);
    },
    effectAllowed: '',
    dropEffect: '',
  };
}

function drag(title: string, toColumn: string) {
  const dt = dataTransfer();
  fireEvent.dragStart(screen.getByText(title).closest('li')!, { dataTransfer: dt });
  const target = screen.getByRole('region', { name: toColumn });
  fireEvent.dragOver(target, { dataTransfer: dt });
  fireEvent.drop(target, { dataTransfer: dt });
}

describe('TaskBoard', () => {
  it('groups tasks into status columns with counts', () => {
    setup();
    const todo = screen.getByRole('region', { name: 'To Do column' });
    expect(within(todo).getByText('Design homepage')).toBeInTheDocument();
    expect(within(todo).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Done column' })).getByText('Project setup')).toBeInTheDocument();
  });

  it('only shows the columns selected by the status filter', () => {
    setup('status', ['DONE']);
    expect(screen.queryByRole('region', { name: 'To Do column' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done column' })).toBeInTheDocument();
  });

  it('changes status when a card is dropped on another status column', () => {
    const { onMove } = setup();
    drag('Design homepage', 'Done column');
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), expect.objectContaining({ patch: { status: 'DONE' } }));
  });

  it('changes priority when grouped by priority', () => {
    const { onMove } = setup('priority');
    drag('Implement UI', 'High priority column');
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), expect.objectContaining({ patch: { priority: 'HIGH' } }));
  });

  it('moves a task to another project when grouped by project', () => {
    const { onMove } = setup('project');
    drag('Design homepage', 'Mobile column');
    expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), expect.objectContaining({ patch: { projectId: 'p2' } }));
  });

  it('ignores drops on the column the card is already in', () => {
    const { onMove } = setup();
    drag('Design homepage', 'To Do column');
    expect(onMove).not.toHaveBeenCalled();
  });

  it('completes a task with the round checkbox', async () => {
    const { onStatusChange } = setup();
    await userEvent.click(screen.getByRole('checkbox', { name: /Mark “Implement UI” as done/ }));
    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), 'DONE');
  });

  it('offers a keyboard-accessible "Move to" action', async () => {
    const { onStatusChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Implement UI' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Done' }));
    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), 'DONE');
  });

  it('quick-adds a task into a column with Enter', async () => {
    const { onQuickAdd } = setup();
    const done = screen.getByRole('region', { name: 'Done column' });
    await userEvent.click(within(done).getByRole('button', { name: 'Add task' }));
    await userEvent.type(within(done).getByRole('textbox', { name: 'New task in Done' }), 'Write release notes{Enter}');
    expect(onQuickAdd).toHaveBeenCalledWith(expect.objectContaining({ key: 'DONE' }), 'Write release notes');
  });

  it('collapses and expands a column', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse In Progress' }));
    expect(screen.getByRole('region', { name: 'In Progress column (collapsed)' })).toBeInTheDocument();
    expect(screen.queryByText('Implement UI')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Expand In Progress' }));
    expect(screen.getByText('Implement UI')).toBeInTheDocument();
  });

  it('opens a task when its title is clicked', async () => {
    const { onEdit } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Project setup' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
  });
});
