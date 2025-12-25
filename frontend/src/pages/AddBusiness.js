import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { companiesAPI } from '../services/api';
import { categories } from '../data/mockData';
import { Building2, Upload } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const AddBusiness = () => {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameRu: '',
    category: '',
    description: '',
    descriptionRu: '',
    phone: '',
    email: '',
    website: '',
    city: 'Kyiv',
    address: '',
    image: 'https://via.placeholder.com/400x300/E0E0E0/666666?text=Company'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: language === 'uk' ? 'Потрібна авторизація' : 'Требуется авторизация',
        description: language === 'uk' ? 'Будь ласка, увійдіть для додавання компанії' : 'Пожалуйста, войдите для добавления компании',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const companyData = {
        name: formData.name,
        nameRu: formData.nameRu || formData.name,
        description: formData.description,
        descriptionRu: formData.descriptionRu || formData.description,
        category: formData.category,
        location: {
          city: formData.city,
          address: formData.address
        },
        contacts: {
          phone: formData.phone,
          email: formData.email,
          website: formData.website || undefined
        },
        image: formData.image,
        images: [],
        isNew: true,
        isActive: true
      };

      await companiesAPI.create(companyData);
      
      toast({
        title: language === 'uk' ? 'Компанію додано' : 'Компания добавлена',
        description: language === 'uk' ? 'Ваша компанія буде перевірена та опублікована найближчим часом' : 'Ваша компания будет проверена и опубликована в ближайшее время'
      });
      
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast({
        title: language === 'uk' ? 'Помилка' : 'Ошибка',
        description: error.response?.data?.detail || (language === 'uk' ? 'Не вдалося додати компанію' : 'Не удалось добавить компанию'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center mr-4">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'uk' ? 'Додати бізнес' : 'Добавить бизнес'}
              </h1>
              <p className="text-gray-600">
                {language === 'uk' ? 'Заповніть форму нижче' : 'Заполните форму ниже'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Назва компанії (українською)' : 'Название компании (на украинском)'} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Name Russian */}
            <div>
              <label htmlFor="nameRu" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Назва компанії (російською)' : 'Название компании (на русском)'}
              </label>
              <input
                type="text"
                id="nameRu"
                name="nameRu"
                value={formData.nameRu}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Категорія' : 'Категория'} *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">{language === 'uk' ? 'Оберіть категорію' : 'Выберите категорию'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {language === 'uk' ? cat.nameUk : cat.nameRu}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Опис' : 'Описание'} *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Зображення' : 'Изображение'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer">
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  {language === 'uk' ? 'Клікніть або перетягніть файл' : 'Кликните или перетащите файл'}
                </p>
                <p className="text-gray-400 text-sm">PNG, JPG, WEBP (макс. 5MB)</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'uk' ? 'Телефон' : 'Телефон'} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Веб-сайт' : 'Веб-сайт'}
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'uk' ? 'Адреса' : 'Адрес'} *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-4 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold text-lg shadow-lg"
            >
              {language === 'uk' ? 'Додати компанію' : 'Добавить компанию'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBusiness;