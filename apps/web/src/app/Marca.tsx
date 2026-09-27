import { Link } from 'react-router-dom';

export function Logo({ className = 'size-7.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="32" height="32" rx="10" fill="#16a34a" />
      <path d="M9.5 17.5l4.2 4.2L22.5 11" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="3.2" fill="#fcd34d" />
    </svg>
  );
}

export function Marca({ a = '/' }: { a?: string }) {
  return (
    <Link to={a} className="inline-flex items-center gap-2.5 text-ink no-underline" aria-label="Crédito MC">
      <Logo />
      <b className="text-[17px] font-extrabold tracking-[-0.03em]">Crédito MC</b>
    </Link>
  );
}
