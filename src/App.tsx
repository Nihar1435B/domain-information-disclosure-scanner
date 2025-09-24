import { useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { useAuthStore } from './hooks/useAuth';

function App() {
  const { session, loading, checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-grow flex items-center justify-center">
          {/* You can replace this with a more sophisticated loading spinner */}
          <p className="text-text-secondary">Loading session...</p>
        </div>
      );
    }
    return session ? <DashboardPage /> : <AuthPage />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-text">
      <Header />
      <main className="flex-grow flex flex-col">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
