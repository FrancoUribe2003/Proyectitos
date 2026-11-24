import type { Task } from './storage/types';

/** Same slug rule the API uses for the `Content-Disposition` filename. */
export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'proyecto'
  );
}

/** Mirrors the API export format: title only, one line per task. */
export function buildTodoMarkdown(projectName: string, tasks: Task[]): string {
  const lines = tasks.map(
    (task) =>
      `- [${task.done ? 'x' : ' '}] ${task.title.replace(/[\r\n]+/g, ' ')}`,
  );
  return `# ${projectName} — TODO\n\n${lines.join('\n')}${
    lines.length > 0 ? '\n' : ''
  }`;
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(filename: string, markdown: string): void {
  downloadBlob(
    filename,
    new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
  );
}
