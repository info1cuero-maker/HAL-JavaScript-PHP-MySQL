import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const Login = () => {
  const { language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast({
        title: language === 'uk' ? 'Вхід успішний' : 'Вход успешный',
        description: language === 'uk' ? 'Ласкаво просимо!' : 'Добро пожаловать!'
      });
      navigate('/dashboard');
    } else {
      toast({
        title: language === 'uk' ? 'Помилка входу' : 'Ошибка входа',
        description: result.error,
        variant: 'destructive'
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center">
              <LogIn size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {language === 'uk' ? 'Вхід' : 'Вход'}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {language === 'uk' ? 'Увійдіть до свого облікового запису' : 'Войдите в свою учетную запись'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Пароль' : 'Пароль'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (language === 'uk' ? 'Вхід...' : 'Вход...') : (language === 'uk' ? 'Увійти' : 'Войти')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {language === 'uk' ? 'Немає облікового запису?' : 'Нет учетной записи?'}{' '}
              <Link to="/register" className="text-pink-600 hover:text-pink-700 font-semibold">
                {language === 'uk' ? 'Зареєструватися' : 'Зарегистрироваться'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;