import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, GraduationCap, Loader2 } from 'lucide-react';

export function AcademyHeader({ active, backLabel }: { active: 'academy' | 'simulator'; backLabel?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#293140] bg-[#11151D]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/academy" className="flex min-w-0 items-center gap-2.5">
          {backLabel ? <ArrowLeft size={16} className="text-[#9BA5B5]" /> : <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF3B4E] shadow-lg shadow-red-950/30"><Flame size={19} className="text-white" /></span>}
          <span className="min-w-0"><span className="flex items-center gap-2"><strong className="text-sm tracking-tight">RED-Lab</strong><span className="hidden rounded border border-[#FF3B4E]/25 bg-[#FF3B4E]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF8A4C] sm:inline">Academy</span></span><span className="block truncate text-[10px] text-[#9BA5B5]">{backLabel ?? 'Cybersecurity learning path'}</span></span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link to="/" className={`rounded-lg px-3 py-2 text-xs font-medium transition ${active === 'simulator' ? 'bg-[#171C26] text-white' : 'text-[#9BA5B5] hover:bg-[#171C26] hover:text-white'}`}>Simulator</Link>
          <Link to="/academy" className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${active === 'academy' ? 'bg-[#FF3B4E] text-white' : 'text-[#9BA5B5] hover:bg-[#171C26] hover:text-white'}`}><GraduationCap size={14} /> Academy</Link>
        </nav>
      </div>
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-[#293140] bg-[#11151D] ${className}`}>{children}</div>;
}

export function PageLoading({ label = 'Loading Academy…' }: { label?: string }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0B0D12] text-[#9BA5B5]"><Loader2 size={30} className="animate-spin text-[#FF3B4E]" /><p className="text-sm">{label}</p></div>;
}

export function CircularProgress({ value, size = 90 }: { value: number; size?: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div role="img" aria-label={`${safeValue}% complete`} className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(#FF3B4E ${safeValue * 3.6}deg, #293140 ${safeValue * 3.6}deg)` }}><div className="grid place-items-center rounded-full bg-[#11151D] text-center" style={{ width: size - 12, height: size - 12 }}><strong className="text-xl leading-none">{safeValue}%</strong><span className="mt-1 text-[9px] uppercase tracking-wide text-[#9BA5B5]">complete</span></div></div>;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
