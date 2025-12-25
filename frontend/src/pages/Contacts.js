import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { contactAPI } from '../services/api';

const Contacts = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await contactAPI.send(formData);
      toast({
        title: language === 'uk' ? 'Повідомлення надіслано' : 'Сообщение отправлено',
        description: language === 'uk' ? 'Ми зв\'\'яжемось з вами найближчим часом' : 'Мы свяжемся с вами в ближайшее время'
      });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast({
        title: language === 'uk' ? 'Помилка' : 'Ошибка',
        description: language === 'uk' ? 'Не вдалося надіслати повідомлення' : 'Не удалось отправить сообщение',
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
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
          {language === 'uk' ? 'Контакти' : 'Контакты'}
        </h1>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          {language === 'uk'
            ? 'Маєте питання або пропозиції? Зв\'\'яжіться з нами!'
            : 'Есть вопросы или предложения? Свяжитесь с нами!'}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {language === 'uk' ? 'Контактна інформація' : 'Контактная информация'}
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {language === 'uk' ? 'Адреса' : 'Адрес'}
                    </h3>
                    <p className="text-gray-600">Київ, Україна</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {language === 'uk' ? 'Телефон' : 'Телефон'}
                    </h3>
                    <a href="tel:+380441234567" className="text-gray-600 hover:text-pink-600 transition-colors">
                      +380 44 123 4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {language === 'uk' ? 'Електронна пошта' : 'Электронная почта'}
                    </h3>
                    <a href="mailto:info@hal.in.ua" className="text-gray-600 hover:text-pink-600 transition-colors">
                      info@hal.in.ua
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden h-64">
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <MapPin size={48} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {language === 'uk' ? 'Надішліть повідомлення' : 'Отправьте сообщение'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'uk' ? 'Ім\'я' : 'Имя'}
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

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
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

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'uk' ? 'Повідомлення' : 'Сообщение'}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold flex items-center justify-center space-x-2"
              >
                <Send size={20} />
                <span>{language === 'uk' ? 'Надіслати' : 'Отправить'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contacts;