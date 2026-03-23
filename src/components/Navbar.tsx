import { FileCode2, History, Github } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface Props {
  onNavigate: (page: 'home' | 'history') => void;
  currentPage: 'home' | 'history';
}

export default function Navbar({ onNavigate, currentPage }: Props) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 bg-linear-to-br from-brand-purple to-brand-pink rounded-lg flex items-center justify-center">
              <FileCode2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">
              Idea2<span className="gradient-text">DevDoc</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentPage === 'history' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-brand-purple' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">히스토리</span>
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
