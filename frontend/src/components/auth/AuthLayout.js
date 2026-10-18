import React from 'react';
import BrandMark from './BrandMark';
import { TEXT } from '../../constants/text';

// Shared frame for login/signup/forgot/reset: gradient header with a sweeping curve over a form sheet
const AuthLayout = ({ title, subtitle, footer, children }) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-4">
    <span className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/10" />
    <span className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/15" />

    <main className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-surface shadow-card">
      <header className="relative bg-gradient-to-br from-accent via-primary to-primary-dark px-8 pb-24 pt-10 text-white">
        <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-16 top-24 h-16 w-16 rounded-full bg-white/10" />
        <div className="relative mb-6 flex items-center gap-2 font-display text-sm font-bold opacity-90">
          <BrandMark className="h-7 w-7" />
          {TEXT.appName}
        </div>
        <h1 className="relative text-3xl font-extrabold">{title}</h1>
        <p className="relative mt-1 text-sm text-white/85">{subtitle}</p>
        <svg viewBox="0 0 400 80" preserveAspectRatio="none" className="absolute bottom-[-1px] left-0 h-16 w-full fill-surface" aria-hidden="true">
          <path d="M0 80V46C110 78 250 70 400 8V80Z" />
        </svg>
      </header>

      <div className="px-6 pb-8 pt-2 sm:px-8">
        {children}
        {footer && <p className="mt-6 text-center text-sm text-ink/70">{footer}</p>}
      </div>
    </main>
  </div>
);

export default AuthLayout;
