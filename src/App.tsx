import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import MobileGate from './components/common/MobileGate';

function App() {
  const { currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile layout immediately before rendering other content
  useEffect(() => {
    const checkMobile = () => {
      // Treat screens smaller than 768px as mobile
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileGate />;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
