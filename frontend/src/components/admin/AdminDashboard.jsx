import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import TeamManagement from './TeamManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { user, token } = useAuth();

  // Tabs configuration
  const tabs = [
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'teams', label: 'Team Management', icon: '🏆' },
    { id: 'coaches', label: 'Coach Assignment', icon: '🎯' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage users, teams, and system settings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Logged in as: <span className="font-medium text-gray-900">{user?.name}</span>
                </div>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  ADMIN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'teams' && <TeamManagement />}
        {activeTab === 'coaches' && <CoachAssignment />}
        {activeTab === 'analytics' && <Analytics />}
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const CoachAssignment = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Coach Assignment</h2>
    <p className="text-gray-600">Coach assignment functionality coming soon...</p>
  </div>
);

const Analytics = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
    <p className="text-gray-600">Analytics and reporting features coming soon...</p>
  </div>
);

export default AdminDashboard;