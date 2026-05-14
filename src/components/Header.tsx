import { Bell, Moon, ScanSearch, Sun, UserCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type AppView = 'home' | 'dashboard' | 'projects' | 'team' | 'profile' | 'notifications' | 'comparison';

export function Header({ activeView, onNavigate }: { activeView: AppView; onNavigate: (view: AppView) => void }) {
  const { theme, toggleTheme } = useTheme();
  const navClass = (view: AppView) =>
    activeView === view
      ? 'relative text-slate-900 dark:text-white after:absolute after:-bottom-[19px] after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-indigo-500 after:to-violet-500'
      : 'text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white';

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200/70 bg-white/75 px-6 backdrop-blur-2xl transition-colors dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between">
        <div className="flex items-center gap-8">
          <button className="group flex items-center gap-3 text-left" onClick={() => onNavigate('home')}>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 transition-transform group-hover:rotate-3 group-hover:scale-105">
              <ScanSearch className="h-4 w-4 text-white" />
              <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] dark:border-slate-950" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">DesignQA<span className="text-indigo-500">·</span>AI</span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-500">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Operational
              </span>
            </span>
          </button>
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            <button onClick={() => onNavigate('dashboard')} className={navClass('dashboard')}>Dashboard</button>
            <button onClick={() => onNavigate('projects')} className={navClass('projects')}>Projects</button>
            <button onClick={() => onNavigate('team')} className={navClass('team')}>Team</button>
            <button onClick={() => onNavigate('comparison')} className={navClass('comparison')}>Comparison</button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white/60 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onNavigate('notifications')}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white/60 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-rose-500 dark:border-slate-950" />
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 bg-white/60 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-200"
            title="Profile"
          >
            <UserCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
