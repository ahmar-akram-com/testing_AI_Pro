import { ArrowRight, Figma, Globe2, Loader2, Play, ScanLine, Sparkles, Zap } from 'lucide-react';

export function Hero({ onRun, isLoading }: { onRun: () => void; onLoadSession?: () => void; isLoading: boolean }) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-12 md:pt-16">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/25" />
        <div className="absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/20" />
        <div className="absolute -bottom-10 left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/20" />
      </div>

      <div className="mx-auto max-w-6xl space-y-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-700 shadow-sm shadow-indigo-500/10 backdrop-blur-md dark:border-indigo-400/30 dark:bg-slate-900/60 dark:text-indigo-200">
          <Sparkles className="h-3.5 w-3.5" />
          Comparison Engine v2.1
          <span className="ml-1 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        </div>

        <div className="space-y-5">
          <h1 className="text-balance text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-[64px] md:leading-[1.05]">
            Pixel-perfect QA between{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
              Figma &amp; Production
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg leading-relaxed text-slate-600 dark:text-slate-400 md:text-xl">
            Detect layout, spacing, typography, and missing element issues before they reach your clients — directly from your Figma design and live page.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row">
          <button
            onClick={onRun}
            disabled={isLoading}
            className="group relative flex h-14 min-w-[260px] items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-500 via-indigo-600 to-violet-600 px-8 text-base font-semibold text-white shadow-2xl shadow-indigo-500/40 ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-500 hover:shadow-indigo-500/50 active:translate-y-0 active:scale-95 disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-current" />}
            <span className="relative">{isLoading ? 'Running Comparison…' : 'Start Comparison'}</span>
            {!isLoading && <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">No installation. Works against any public URL.</span>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={Figma}
            iconClass="from-violet-500 to-fuchsia-500"
            title="Figma Sourcing"
            text="Parses frames, components and tokens directly from the Figma API."
          />
          <FeatureCard
            icon={Globe2}
            iconClass="from-sky-500 to-indigo-500"
            title="Live Page Capture"
            text="Renders the target URL headlessly to extract real DOM geometry."
          />
          <FeatureCard
            icon={ScanLine}
            iconClass="from-emerald-500 to-teal-500"
            title="Smart Diffing"
            text="Pixel + structural diff with severity-ranked issue backlog."
          />
        </div>

        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-xs text-slate-500 dark:text-slate-400">
          <Pill icon={Zap} label="Layout · Spacing · Typography" />
          <Pill icon={Sparkles} label="Severity-ranked findings" />
          <Pill icon={ScanLine} label="Pixelmatch visual diff" />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  iconClass,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  text: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/60">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${iconClass} text-white shadow-lg shadow-black/10`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </article>
  );
}

function Pill({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3 py-1 font-medium dark:border-slate-800 dark:bg-slate-900/50">
      <Icon className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
      {label}
    </span>
  );
}
