import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type Task } from '@/lib/types';
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
  task({ id: 'c', title: 'Project setup', status: 'DONE', priority: 'LOW' }),
];

function setup(visibleStatuses: Task['status'][] = []) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onStatusChange: vi.fn(), onCreate: vi.fn() };
  render(<TaskBoard tasks={tasks} visibleStatuses={visibleStatuses} showProject {...handlers} />);
  return handlers;
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
    setup(['DONE']);
    expect(screen.queryByRole('region', { name: 'To Do column' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done column' })).toBeInTheDocument();
  });

  it('moves a task when it is dropped on another column', () => {
    const { onStatusChange } = setup();
    const store: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => (store[k] = v),
      getData: (k: string) => store[k],
      get types() {
        return Object.keys(store);
      },
      effectAllowed: '',
      dropEffect: '',
    };

    const card = screen.getByText('Design homepage').closest('li')!;
    fireEvent.dragStart(card, { dataTransfer });
    const done = screen.getByRole('region', { name: 'Done column' });
    fireEvent.dragOver(done, { dataTransfer });
    fireEvent.drop(done, { dataTransfer });

    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'DONE');
  });

  it('offers a keyboard-accessible "Move to" action', async () => {
    const { onStatusChange } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Actions for Implement UI' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Move to Done' }));
    expect(onStatusChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }), 'DONE');
  });

  it('opens a task for editing when its title is clicked', async () => {
    const { onEdit } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Project setup' }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
  });
});
