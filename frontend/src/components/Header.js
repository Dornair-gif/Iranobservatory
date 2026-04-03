import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Globe, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_iran-events-live/artifacts/fw3i5dcu_Iran%20Observatory%20Logo.png";

export function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const languages = [
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'fa', label: 'فارسی', flag: 'FA' },
  ];

  return (
    <header className="glass-header sticky top-0 z-50 overflow-hidden" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group -my-4"
            data-testid="logo-link"
          >
            <img 
              src={LOGO_URL} 
              alt="Iran Observatory"
              className="h-36 sm:h-40 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse-live" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#3DB883]">
                {t('live')}
              </span>
            </div>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider rounded-none"
                  data-testid="lang-switcher-btn"
                >
                  <Globe className="w-4 h-4" strokeWidth={1.5} />
                  {languages.find(l => l.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-none border-zinc-200">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer ${
                      language === lang.code ? 'bg-zinc-100' : ''
                    }`}
                    data-testid={`lang-switch-${lang.code}`}
                  >
                    <span className="w-8">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider rounded-none"
                    data-testid="user-menu-btn"
                  >
                    <User className="w-4 h-4" strokeWidth={1.5} />
                    {t('admin')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-none border-zinc-200">
                  <DropdownMenuItem asChild className="rounded-none cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider" data-testid="admin-link">
                      {t('dashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer text-red-600"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" data-testid="login-link">
                <Button className="btn-secondary rounded-none">
                  {t('login')}
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" strokeWidth={1.5} />
            ) : (
              <Menu className="w-6 h-6" strokeWidth={1.5} />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 py-4 space-y-4">
            <div className="flex items-center gap-2 px-2">
              <span className="w-2 h-2 bg-[#3DB883] rounded-full animate-pulse-live" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#3DB883]">
                {t('live')}
              </span>
            </div>
            
            <div className="flex gap-2 px-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 font-mono text-xs uppercase tracking-wider border ${
                    language === lang.code 
                      ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' 
                      : 'border-zinc-200'
                  }`}
                  data-testid={`mobile-lang-${lang.code}`}
                >
                  {lang.flag}
                </button>
              ))}
            </div>

            {user ? (
              <div className="space-y-2 px-2">
                <Link
                  to="/admin"
                  className="block w-full text-left px-3 py-2 font-mono text-xs uppercase tracking-wider border border-zinc-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 font-mono text-xs uppercase tracking-wider border border-red-200 text-red-600"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block mx-2 text-center px-3 py-2 font-mono text-xs uppercase tracking-wider bg-[#1E3A5F] text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('login')}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
