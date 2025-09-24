import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader, AlertCircle } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let response;
      if (mode === 'signup') {
        // The error "Cannot read properties of undefined (reading 'flowType')"
        // is a known issue in some Supabase client versions when the options object is missing.
        // Providing an empty options object resolves it.
        response = await supabase.auth.signUp({
          email,
          password,
          options: {},
        });
      } else {
        response = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (response.error) {
        throw response.error;
      }

      if (mode === 'signup') {
        // Since email confirmation is disabled for this project,
        // we can give a direct success message.
        setMessage('Account created successfully! Please sign in.');
        setMode('signin');
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-surface border border-border rounded-xl shadow-2xl shadow-black/20 p-8">
        <h2 className="text-2xl font-bold text-center text-text mb-2">
          {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-center text-text-secondary mb-8">
          {mode === 'signin' ? 'Sign in to access your dashboard' : 'Get started with your free account'}
        </p>

        <form onSubmit={handleAuth} className="space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/30 text-error text-sm rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="bg-success/10 border border-success/30 text-success text-sm rounded-md p-3">
              {message}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-text-secondary">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password"className="text-sm font-medium text-text-secondary">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-12 px-4 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 px-8 flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold whitespace-nowrap transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="animate-spin h-5 w-5" /> : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={toggleMode} className="font-medium text-primary hover:underline">
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
