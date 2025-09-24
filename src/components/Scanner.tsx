import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Scanner = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('scan-domain', {
        body: { domain },
      });

      if (functionError) {
        if (data && data.error) {
          throw new Error(data.error);
        }
        throw new Error(functionError.message);
      }
      
      setDomain('');
      setSuccess(`Scan for ${domain} started successfully! Results will appear below.`);
    } catch (err: any) {
      console.error("Failed to invoke scan function:", err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto">
      <div className="bg-surface border border-border rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-text">Start a New Scan</h2>
        <p className="mt-2 text-text-secondary">
          Enter a domain to scan for potential information disclosures.
        </p>

        <form onSubmit={handleScan} className="mt-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., example.com"
                className="w-full h-14 pl-12 pr-4 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-error flex items-center gap-2 text-left"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
             {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-success flex items-center gap-2 text-left"
              >
                <span>{success}</span>
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !domain}
            className="w-full sm:w-auto h-14 px-8 flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-semibold whitespace-nowrap transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5" />
                <span>Starting...</span>
              </>
            ) : (
              'Scan Domain'
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
