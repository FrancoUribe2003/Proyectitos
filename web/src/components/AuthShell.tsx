import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { Logo } from './Logo';

const BENEFITS = [
  'Proyectos, notas y TODO en un mismo lugar.',
  'Tus datos en la nube, disponibles desde cualquier equipo.',
  'Compartí proyectos y sumá colaboradores.',
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-canvas lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-accent px-10 py-12 text-on-accent lg:flex xl:px-14">
        <svg
          viewBox="0 0 600 600"
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-40 size-[34rem] text-on-accent/20"
          fill="none"
        >
          <circle cx="300" cy="300" r="238" stroke="currentColor" />
          <circle cx="300" cy="300" r="176" stroke="currentColor" />
          <circle cx="300" cy="300" r="114" stroke="currentColor" />
          <path
            d="M62 300h476M300 62v476"
            stroke="currentColor"
            strokeDasharray="2 10"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-on-accent text-accent">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
              <path
                d="M4.5 8.25h15M4.5 12h15M4.5 15.75h9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M6.75 5.25h10.5c.828 0 1.5.672 1.5 1.5v10.5c0 .828-.672 1.5-1.5 1.5H6.75c-.828 0-1.5-.672-1.5-1.5V6.75c0-.828.672-1.5 1.5-1.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">
            Proyectitos
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-on-accent xl:text-[3rem]">
            Tus proyectos, por fin en un solo lugar.
          </h2>
          <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-on-accent">
            Dejá de saltar entre notas, links y tareas sueltas. Cada proyecto
            tiene su espacio, y vos tenés el panorama completo.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-on-accent text-accent">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-on-accent">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-on-accent">
          Un lugar tranquilo para lo que estás construyendo.
        </p>
      </aside>

      <main className="flex min-h-svh flex-col px-5 py-6 sm:px-8 lg:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-ink-muted">
          Proyectitos · tus proyectos, en orden
        </p>
      </main>
    </div>
  );
}
