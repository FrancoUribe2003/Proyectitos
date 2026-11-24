import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Página no encontrada');

  return (
    <div className="flex flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
        <Compass className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-6 font-display text-[4rem] font-semibold leading-none tracking-tight text-accent-line sm:text-[5rem]">
        404
      </p>
      <h1 className="mt-3 text-2xl text-ink sm:text-3xl">
        Esta página no existe
      </h1>
      <p className="mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-soft">
        El link puede estar roto o la página puede haberse movido. Volvé al
        inicio para encontrar tus proyectos.
      </p>
      <Link to="/" className="btn btn-md btn-primary mt-6">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a proyectos
      </Link>
    </div>
  );
}
