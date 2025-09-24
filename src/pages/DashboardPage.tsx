import { Scanner } from '../components/Scanner';
import { ScanHistory } from '../components/ScanHistory';

export const DashboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">Dashboard</h1>
        <p className="mt-3 max-w-2xl mx-auto text-lg text-text-secondary">
          Manage your web assets and review security scan reports.
        </p>
      </div>
      {/* The scanner now simply triggers the function. Realtime handles the UI updates. */}
      <Scanner />
      {/* The ScanHistory component is now fully self-managed via Realtime subscriptions. */}
      <ScanHistory />
    </div>
  );
};
