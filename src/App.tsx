import React from 'react';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/common/Navbar';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';

function App() {
  const { currentUser } = useAuth();
  
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
