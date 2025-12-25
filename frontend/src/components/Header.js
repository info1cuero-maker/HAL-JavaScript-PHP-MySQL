import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut } from 'lucide-react';

const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLanguageSwitch = (lang) => {
    setLanguage(lang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">hal</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-1 text-sm">
              <button
                onClick={() => handleLanguageSwitch('uk')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'uk' ? 'text-pink-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                UA
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={() => handleLanguageSwitch('ru')}
                className={`px-2 py-1 rounded transition-colors ${
                  language === 'ru' ? 'text-pink-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                RU
              </button>
            </div>
            <Link
              to="/"
              className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/search"
              className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
            >
              {t('nav.search')}
            </Link>
            <Link
              to="/blog"
              className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
            >
              {t('nav.blog')}
            </Link>
            <Link
              to="/contacts"
              className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
            >
              {t('nav.contacts')}
            </Link>
            <Link
              to="/add-business"
              className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2.5 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              {t('nav.addBusiness')}
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors font-medium"
                >
                  <User size={20} />
                  <span>{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-700 hover:text-pink-600 transition-colors font-medium"
                >
                  <LogOut size={20} />
                  <span>{language === 'uk' ? 'Вихід' : 'Выход'}</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-700 hover:text-pink-600 transition-colors font-medium"
              >
                {t('nav.login')}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-3 pt-4">
              <div className="flex items-center space-x-2 pb-2">
                <button
                  onClick={() => handleLanguageSwitch('uk')}
                  className={`px-3 py-1 rounded transition-colors ${
                    language === 'uk' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  UA
                </button>
                <button
                  onClick={() => handleLanguageSwitch('ru')}
                  className={`px-3 py-1 rounded transition-colors ${
                    language === 'ru' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  RU
                </button>
              </div>
              <Link
                to="/"
                className="text-gray-700 hover:text-pink-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/search"
                className="text-gray-700 hover:text-pink-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.search')}
              </Link>
              <Link
                to="/blog"
                className="text-gray-700 hover:text-pink-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.blog')}
              </Link>
              <Link
                to="/contacts"
                className="text-gray-700 hover:text-pink-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.contacts')}
              </Link>
              <Link
                to="/add-business"
                className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.addBusiness')}
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;