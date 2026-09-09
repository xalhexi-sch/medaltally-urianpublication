import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5">
      <div 
        className="glass-card shine-border max-w-md rounded-xl p-8 text-center opacity-0 animate-fade-in-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">404</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Page Not Found</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/40">
          The page you tried to open does not exist or may have moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
          <Link
            to="/servers"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            Servers
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
