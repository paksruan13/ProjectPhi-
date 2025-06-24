import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Register = ({ onSwitchToLogin, isModal = false }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [showTeamCode, setShowTeamCode] = useState(false); // Toggle for team code field
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, registerWithTeam } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate team code if provided
    if (showTeamCode && !teamCode.trim()) {
      setError('Please enter a team code or uncheck "Have a team code?"');
      setLoading(false);
      return;
    }

    let result;

    if (showTeamCode && teamCode.trim()) {
      // Register with team code (uses team registration endpoint)
      await registerWithTeam(name, email, password, teamCode.trim().toUpperCase());
      return;
    } else {
      // Regular individual registration (defaults to STUDENT role, no team)
      result = await register(name, email, password, 'STUDENT', null);

      if (result.success) {
      // Registration successful - modal will close automatically
        console.log('Registration successful');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTeamCode('');
        setShowTeamCode(false);
      } else {
        setError(result.error || 'Registration failed');
      }
      setLoading(false);
      }
  };

  const formContent = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Team Code Toggle */}
      <div className="border-t pt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showTeamCode}
            onChange={(e) => {
              setShowTeamCode(e.target.checked);
              if (!e.target.checked) {
                setTeamCode(''); // Clear team code when unchecked
              }
            }}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Have a team code? 🏆
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Check this if you have a team code to join an existing team
        </p>
      </div>

      {/* Team Code Input - Only show when checkbox is checked */}
      {showTeamCode && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <label htmlFor="teamCode" className="block text-sm font-medium text-blue-700 mb-2">
            Team Code
          </label>
          <input
            id="teamCode"
            name="teamCode"
            type="text"
            required={showTeamCode}
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())} // Auto-uppercase
            placeholder="Enter your team code (e.g. ALPH123)"
            className="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
          />
          <p className="text-xs text-blue-600 mt-1">
            💡 Get your team code from your coach or team leader
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating account...' : (showTeamCode ? 'Join Team & Create Account' : 'Create Account')}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          Already have an account? Sign in
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
        <p className="font-medium mb-1">📝 Registration Info:</p>
        <ul className="space-y-1">
          <li>• <strong>Without team code:</strong> Join as individual student</li>
          <li>• <strong>With team code:</strong> Automatically join your team</li>
          <li>• You can join a team later from your profile</li>
        </ul>
      </div>
    </form>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Join Project Phi
          </h2>
        </div>
        {formContent}
      </div>
    </div>
  );
};

export default Register;