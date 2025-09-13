import React, { useState } from 'react';
import { Eye, EyeOff, Shield, User, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const { login, isLoading } = useAuth();

  const roles = [
    { value: 'Super Admin', label: 'Super Admin', icon: Shield, description: 'Full system access' },
    { value: 'Department Head', label: 'Department Head', icon: Building2, description: 'Manage department issues' },
    { value: 'Staff', label: 'Staff', icon: User, description: 'View and update assigned issues' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !role) {
      setError('Please fill in all fields');
      return;
    }

    // Check for too many login attempts
    if (loginAttempts >= 3) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    const success = await login(email, password, role);
    if (!success) {
      setLoginAttempts(prev => prev + 1);
      setError(`Invalid credentials or role. Attempts remaining: ${3 - loginAttempts - 1}`);
    } else {
      setLoginAttempts(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Civic Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Role
              </label>
              <div className="space-y-2">
                {roles.map((roleOption) => {
                  const Icon = roleOption.icon;
                  return (
                    <label
                      key={roleOption.value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        role === roleOption.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={roleOption.value}
                        checked={role === roleOption.value}
                        onChange={(e) => setRole(e.target.value)}
                        className="sr-only"
                      />
                      <Icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {roleOption.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {roleOption.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="text-xs text-gray-600">
                    Password strength: {
                      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)
                        ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || loginAttempts >= 3}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : loginAttempts >= 3 ? 'Account Locked' : 'Sign in'}
            </button>
          </form>

          {/* Admin Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Admin Login Credentials:</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div><strong>Super Admin:</strong> admin@cityportal.gov / Admin@2024!</div>
              <div><strong>Roads Dept Head:</strong> john@roads.gov / Roads@2024!</div>
              <div><strong>Electrical Dept Head:</strong> sarah@electrical.gov / Electrical@2024!</div>
              <div><strong>Water Staff:</strong> mike@water.gov / Water@2024!</div>
              <div><strong>Sanitation Staff:</strong> lisa@sanitation.gov / Sanitation@2024!</div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <Shield className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <strong>Security Notice:</strong> This is a secure admin portal. All login attempts are logged and monitored. 
                After 3 failed attempts, your account will be temporarily locked.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;