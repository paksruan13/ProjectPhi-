import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Leaderboard from './components/Leaderboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/admin/AdminDashboard';
import CoachDashboard from './components/CoachDashboard';

const AppContent = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentView, setCurrentView] = useState('leaderboard'); // Add view state
  
  const { user, loading, logout, isCoach, isAdmin } = useAuth();

  

  useEffect(() => {
    if(user) {
      console.log('User logged in:', user);
      setShowLogin(false);
      setShowRegister(false);
    }
  }, [user]);

  // Handle opening login modal
  const handleLoginClick = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleCloseModals = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with authentication controls */}
      <header className="bg-white shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gray-900">Project Phi</h1>
            
            {/* Navigation */}
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'leaderboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leaderboard
              </button>
              {isCoach && (
                <button
                  onClick={() => setCurrentView('coach')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'coach'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Coach Dashboard
                </button>
              )}
              
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin Panel
                </button>
              )}
            </nav>
          </div>
          
          {/* Authentication section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : user ? (
              <>
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user.name}</span>
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Role-specific notifications for authenticated users */}
      {user && currentView === 'leaderboard' && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          {isCoach && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-700">
                🏆 <strong>Coach Dashboard:</strong> You can manage your teams and approve activities (coming soon!)
              </p>
            </div>
          )}
          
          {isAdmin && (
            <div className="bg-purple-100 border-l-4 border-purple-500 p-4 mb-4">
              <p className="text-purple-700">
                ⚙️ <strong>Admin Panel:</strong> Click "Admin Panel" above to manage users and teams!
              </p>
            </div>
          )}

          {user.role === 'STUDENT' && (
            <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">
                🎯 <strong>Member Portal:</strong> Submit photos, track donations, and compete with your team!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <main>
        {currentView === 'leaderboard' && <Leaderboard />}
        {currentView === 'coach' && isCoach && <CoachDashboard />} {/* <-- ADD THIS LINE */}
        {currentView === 'admin' && isAdmin && <AdminDashboard />}
        {currentView === 'admin' && !isAdmin && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Access denied. Admin privileges required.
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-end">
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mt-3">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
                Sign in to Project Phi
              </h2>
              <Login 
                onSwitchToRegister={handleSwitchToRegister}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-end">
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="mt-3">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
                Join Project Phi
              </h2>
              <Register 
                onSwitchToLogin={handleSwitchToLogin}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;