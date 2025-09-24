export type ScanResult = {
  id: string;
  url: string;
  description: string;
  severity: string;
  created_at: string;
  scan_id: string;
  user_id: string;
};

export type Scan = {
  id: string;
  domain: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  user_id: string;
  scan_results: ScanResult[];
};
