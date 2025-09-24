export const VULNERABILITY_PATTERNS = [
  { path: '/.git/config', description: 'Publicly exposed .git/config file', severity: 'High' },
  { path: '/.env', description: 'Publicly exposed .env file', severity: 'Critical' },
  { path: '/.aws/credentials', description: 'Exposed AWS credentials file', severity: 'Critical' },
  { path: '/wp-config.php', description: 'Exposed WordPress configuration file', severity: 'High' },
  { path: '/_debugbar/open', description: 'Laravel Debugbar open handler', severity: 'Medium' },
  { path: '/.hg/hgrc', description: 'Publicly exposed Mercurial config', severity: 'High' },
  { path: '/server-status', description: 'Apache server-status page exposed', severity: 'Medium' },
  { path: '/phpinfo.php', description: 'PHP info file exposed', severity: 'Medium' },
  { path: '/.DS_Store', description: 'macOS .DS_Store file exposed', severity: 'Low' },
  { path: '/.idea/workspace.xml', description: 'JetBrains IDE workspace file exposed', severity: 'Low' },
];

// Type definition for a single scan result finding
export type ScanResult = {
  scan_id: string;
  user_id: string;
  url: string;
  description: string;
  severity: string;
};
