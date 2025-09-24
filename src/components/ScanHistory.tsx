import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, AlertTriangle, CheckCircle, FileText, Loader } from 'lucide-react';

// Define types for our data for better code quality
type ScanResult = {
  id: string;
  url: string;
  description: string;
  severity: string;
};

type Scan = {
  id: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  scan_results: ScanResult[];
};

const SEVERITY_STYLES = {
  'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
  'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Low': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const STATUS_ICON = {
  running: <Loader className="h-5 w-5 animate-spin text-primary" />,
  completed: <CheckCircle className="h-5 w-5 text-success" />,
  failed: <AlertTriangle className="h-5 w-5 text-error" />,
  pending: <Clock className="h-5 w-5 text-text-secondary" />,
};

const ScanCard = ({ scan }: { scan: Scan }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div layout className="bg-surface border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          {STATUS_ICON[scan.status]}
          <span className="font-mono font-medium text-text">{scan.domain}</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${scan.status === 'running' ? 'bg-primary/20 text-primary' : 'bg-surface'}`}>
            {scan.status}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {new Date(scan.created_at).toLocaleString()}
          </span>
          <ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border">
              {scan.scan_results.length > 0 ? (
                <ul className="space-y-3">
                  {scan.scan_results.map(result => (
                    <li key={result.id} className="flex items-start gap-4 p-3 bg-background rounded-md">
                      <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${SEVERITY_STYLES[result.severity as keyof typeof SEVERITY_STYLES]}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">{result.description}</p>
                        <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{result.url}</a>
                        <p className={`mt-1 text-xs font-bold ${SEVERITY_STYLES[result.severity as keyof typeof SEVERITY_STYLES].split(' ')[1]}`}>{result.severity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <FileText className="mx-auto h-10 w-10 text-text-secondary" />
                  <p className="mt-2 text-text-secondary">No vulnerabilities found for this scan.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const ScanHistory = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          *,
          scan_results (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scan history:', error);
      } else if (data) {
        setScans(data as Scan[]);
      }
      setLoading(false);
    };

    fetchInitialData();

    const channel = supabase
      .channel('scans-history')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scans' },
        () => fetchInitialData() // Re-fetch all data on any change for simplicity
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-12 w-full max-w-4xl mx-auto text-center">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-text-secondary">Loading scan history...</p>
      </div>
    );
  }

  return (
    <section className="mt-12 w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-text mb-6">Scan History</h2>
      {scans.length > 0 ? (
        <motion.div layout className="space-y-4">
          {scans.map(scan => (
            <ScanCard key={scan.id} scan={scan} />
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-medium text-text">No scans yet</h3>
          <p className="mt-1 text-text-secondary">Your scan history will appear here.</p>
        </div>
      )}
    </section>
  );
};
