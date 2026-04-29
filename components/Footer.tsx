
import React from 'react';
import { ParrotIcon } from './icons/ParrotIcon';

export const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer>
      {/* ── Desktop footer complet ───────────────────────── */}
      <div className="hidden md:block bg-dark text-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          <div className="grid grid-cols-3 gap-8 items-start">

            {/* Kasuku brand */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <ParrotIcon className="h-7 w-7 text-primary shrink-0" />
                <span className="text-xl font-bold text-white tracking-tight">Kasuku</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed max-w-[220px]">
                La mémoire vivante de l'Afrique au bout des doigts.
              </p>
            </div>

            {/* Liens */}
            <div className="flex flex-col gap-2 items-center">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1">Liens</p>
              <a href="#" className="text-sm hover:text-primary transition-colors">Politique de confidentialité</a>
              <a href="#" className="text-sm hover:text-primary transition-colors">Conditions d'utilisation</a>
            </div>

            {/* Afrikia credit */}
            <div className="flex flex-col gap-2 items-end">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-1">Créé par</p>
              <a
                href="https://afrikia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 hover:opacity-100 transition-opacity"
                title="Afrikia"
              >
                <img src="/afrikia-logo-white.svg" alt="Afrikia" className="h-7 w-auto" style={{ minWidth: '90px' }} />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-white/30">&copy; {year} Kasuku · Tous droits réservés.</p>
          </div>
        </div>
      </div>

      {/* ── Mobile — ligne crédit discrète uniquement ────── */}
      <div className="md:hidden py-3 px-4 flex items-center justify-center gap-2 opacity-40">
        <ParrotIcon className="h-4 w-4 text-dark shrink-0" />
        <p className="text-[11px] text-dark/70 leading-none">
          Kasuku · La mémoire vivante de l'Afrique ·{' '}
          <a href="https://afrikia.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Afrikia
          </a>
        </p>
      </div>
    </footer>
  );
};
