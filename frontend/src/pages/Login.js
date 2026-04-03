import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/tkhn3g6l_Iran%20Observatory%20Logo%20transparent%20%281%29.png";

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export default function Login() {
  const { user, login, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4" data-testid="login-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <img 
              src={LOGO_URL} 
              alt="Iran Observatory"
              className="h-16 w-auto mx-auto"
            />
          </div>
          <p className="text-sm text-zinc-500 mt-1">{t('admin')} {t('login')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-zinc-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm" data-testid="login-error">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border-zinc-200 focus:border-[#3DB883] focus:ring-[#3DB883]"
                placeholder="admin@example.com"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border-zinc-200 focus:border-[#3DB883] focus:ring-[#3DB883]"
                placeholder="••••••••"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#2A4A73] text-white rounded-none uppercase tracking-widest text-xs font-bold py-3 flex items-center justify-center gap-2"
              data-testid="login-submit-btn"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('login')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
