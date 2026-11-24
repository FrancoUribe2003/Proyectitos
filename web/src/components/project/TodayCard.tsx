import { useState, type KeyboardEvent } from 'react';
import { Sparkles } from 'lucide-react';

interface TodayCardProps {
  /** Hook for the upcoming AI summary / task marker; today the text stays local. */
  onSubmit?: (text: string) => void;
}

const MAX_LENGTH = 2000;

export function TodayCard({ onSubmit }: TodayCardProps) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (onSubmit) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <section className="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="today-title">
      <h2 id="today-title" className="text-xl text-ink">
        Qué hice hoy
      </h2>

      <div className="mt-4 flex flex-1 flex-col">
        <label htmlFor="today-text" className="sr-only">
          Contá qué hiciste hoy
        </label>
        <textarea
          id="today-text"
          className="field min-h-32 flex-1 resize-y"
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          placeholder="Anotá lo que avanzaste y presioná Enter…"
          aria-describedby="today-hint"
        />
        <div
          id="today-hint"
          className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
            <span>
              Presioná <strong>Enter</strong> para marcar tareas con IA
            </span>
            <span className="chip border border-line bg-surface-muted px-1.5 py-0 text-[10px] font-normal text-ink-muted">
              Próximamente
            </span>
          </span>
          <span className="tabular-nums">
            {text.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>
    </section>
  );
}
