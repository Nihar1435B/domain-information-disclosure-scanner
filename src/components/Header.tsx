import { ShieldCheck, SearchCode, LogOut } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';

export const Header = () => {
  const { session, signOut } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <SearchCode className="absolute -bottom-1 -right-1 h-5 w-5 text-secondary" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter">GuardianLens</h1>
        </div>
        
        {session ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary hidden sm:inline">{session.user.email}</span>
            <button 
              onClick={signOut}
              className="flex items-center gap-2 h-9 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-surface transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-2 text-sm">
            <button className="h-9 px-4 py-2 rounded-md hover:bg-surface transition-colors text-text-secondary">
              Sign In
            </button>
            <button className="h-9 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-white shadow transition-colors hover:bg-primary/90">
              Sign Up
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
