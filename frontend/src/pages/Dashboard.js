import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { BarChart3, Eye, MessageSquare, Building2, TrendingUp, Edit } from 'lucide-react';

const Dashboard = () => {
  const { language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadDashboard();
  }, [isAuthenticated]);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/users/me/dashboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded-xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
              <div className="h-24 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {language === 'uk' ? 'Особистий кабінет' : 'Личный кабинет'}
              </h1>
              <p className="text-gray-600">
                {language === 'uk' ? 'Вітаємо,' : 'Добро пожаловать,'} {user?.name}!
              </p>
            </div>
            <Link
              to="/add-business"
              className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold"
            >
              {language === 'uk' ? '+ Додати компанію' : '+ Добавить компанию'}
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {dashboard && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Building2 size={32} className="text-pink-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboard.overview.totalCompanies}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'uk' ? 'Компаній' : 'Компаний'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <Eye size={32} className="text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboard.overview.totalViews}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'uk' ? 'Переглядів' : 'Просмотров'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare size={32} className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboard.overview.totalReviews}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'uk' ? 'Відгуків' : 'Отзывов'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp size={32} className="text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {dashboard.overview.companiesActive}
                </div>
                <div className="text-sm text-gray-600">
                  {language === 'uk' ? 'Активних' : 'Активных'}
                </div>
              </div>
            </div>

            {/* Companies List */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'uk' ? 'Мої компанії' : 'Мои компании'}
              </h2>

              {dashboard.companies.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    {language === 'uk' ? 'У вас ще немає компаній' : 'У вас еще нет компаний'}
                  </p>
                  <Link
                    to="/add-business"
                    className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold"
                  >
                    {language === 'uk' ? 'Додати першу компанію' : 'Добавить первую компанию'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.companies.map((company) => (
                    <div
                      key={company.companyId}
                      className="border border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/company/${company.companyId}`}
                            className="text-xl font-semibold text-gray-900 hover:text-pink-600 transition-colors mb-2 block"
                          >
                            {company.companyName}
                          </Link>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <div className="text-2xl font-bold text-gray-900">
                                {company.totalViews}
                              </div>
                              <div className="text-sm text-gray-600">
                                {language === 'uk' ? 'Всього переглядів' : 'Всего просмотров'}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-2xl font-bold text-gray-900">
                                {company.viewsThisWeek}
                              </div>
                              <div className="text-sm text-gray-600">
                                {language === 'uk' ? 'За тиждень' : 'За неделю'}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-2xl font-bold text-gray-900">
                                {company.totalReviews}
                              </div>
                              <div className="text-sm text-gray-600">
                                {language === 'uk' ? 'Відгуків' : 'Отзывов'}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-2xl font-bold text-gray-900">
                                {company.averageRating.toFixed(1)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {language === 'uk' ? 'Рейтинг' : 'Рейтинг'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          to={`/company/${company.companyId}`}
                          className="ml-4 p-2 text-gray-600 hover:text-pink-600 transition-colors"
                        >
                          <Edit size={20} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
