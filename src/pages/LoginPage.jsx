/**
 * GearGuard - Login Page
 * 
 * Authentication page with demo credentials display.
 */

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Demo credentials for easy testing
  const demoCredentials = [
    { role: 'Admin', email: 'admin@gearguard.com', password: 'admin123' },
    { role: 'Manager', email: 'manager@gearguard.com', password: 'manager123' },
    { role: 'Technician', email: 'tech1@gearguard.com', password: 'tech123' },
    { role: 'User', email: 'user@gearguard.com', password: 'user123' }
  ];

  // Redirect if already authenticated
  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      success('Welcome back!', 'You have been logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      showError('Login Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsSubmitting(true);

    try {
      await login(demoEmail, demoPassword);
      success('Welcome back!', 'You have been logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">GearGuard</h1>
          <p className="text-gray-600 mt-2">Enterprise Maintenance Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={Mail}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                icon={Lock}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Credentials</h3>
          <div className="grid grid-cols-2 gap-2">
            {demoCredentials.map((cred) => (
              <button
                key={cred.role}
                onClick={() => handleDemoLogin(cred.email, cred.password)}
                disabled={isSubmitting}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <span className="block text-sm font-medium text-gray-900">{cred.role}</span>
                <span className="block text-xs text-gray-500 truncate">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 GearGuard. Enterprise Maintenance System.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
