// This file is no longer used for the primary scanning logic,
// as it has been moved to the Supabase Edge Function.
// It can be safely removed or kept for reference.

export interface ScanResult {
  url: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

export const scanDomain = async (domain: string): Promise<ScanResult[]> => {
  console.warn("scanDomain is deprecated. Scanning is now performed on the server via Edge Functions.");
  return Promise.resolve([]);
};
