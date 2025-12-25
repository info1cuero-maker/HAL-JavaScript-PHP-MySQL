import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { companiesAPI, reviewsAPI } from '../services/api';
import { MapPin, Star, Phone, Mail, Globe, ArrowLeft, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const CompanyDetail = () => {
  const { id } = useParams();
  const { language, t } = useLanguage();
  const [company, setCompany] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadCompany();
    loadReviews();
  }, [id]);

  const loadCompany = async () => {
    try {
      const response = await companiesAPI.getById(id);
      setCompany(response.data);
    } catch (error) {
      console.error('Failed to load company:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await reviewsAPI.getByCompany(id);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const nextImage = () => {
    if (company && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (company && allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-gray-200 rounded-xl h-96 mb-6"></div>
                <div className="bg-gray-200 rounded-xl h-64"></div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-gray-200 rounded-xl h-96"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'uk' ? 'Компанію не знайдено' : 'Компания не найдена'}
          </h1>
          <Link to="/" className="text-pink-600 hover:text-pink-700 font-semibold">
            {language === 'uk' ? 'Повернутись на головну' : 'Вернуться на главную'}
          </Link>
        </div>
      </div>
    );
  }

  const name = language === 'uk' ? company.name : company.nameRu;
  const description = language === 'uk' ? company.description : company.descriptionRu;
  
  // Combine main image with additional images
  const allImages = [company.image, ...(company.images || [])].filter(Boolean).slice(0, 10);
  const currentImage = allImages[currentImageIndex] || company.image;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/search"
          className="inline-flex items-center text-pink-600 hover:text-pink-700 font-semibold mb-6 group"
        >
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          {language === 'uk' ? 'Назад до пошуку' : 'Назад к поиску'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header Image */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <img
                src={company.image}
                alt={name}
                className="w-full h-96 object-cover"
              />
              <div className="p-6">
                {company.isNew && (
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                    {t('sections.new')}
                  </span>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{name}</h1>
                
                {/* Rating */}
                {company.rating && (
                  <div className="flex items-center mb-4">
                    <Star size={24} className="text-yellow-400 fill-yellow-400 mr-2" />
                    <span className="text-2xl font-bold text-gray-900 mr-2">{company.rating}</span>
                    <span className="text-gray-600">({company.reviews} {language === 'uk' ? 'відгуків' : 'отзывов'})</span>
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin size={20} className="mr-2" />
                  <span className="text-lg">{company.location.city}, {company.location.address}</span>
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">{description}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {language === 'uk' ? 'Відгуки' : 'Отзывы'}
              </h2>
              <p className="text-gray-600">
                {language === 'uk' ? 'Відгуки поки відсутні' : 'Отзывы пока отсутствуют'}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {language === 'uk' ? 'Контактна інформація' : 'Контактная информация'}
              </h3>

              {/* Phone */}
              {company.contacts.phone && (
                <div className="flex items-center mb-4 text-gray-700">
                  <Phone size={18} className="mr-3 text-pink-600" />
                  <a href={`tel:${company.contacts.phone}`} className="hover:text-pink-600 transition-colors">
                    {company.contacts.phone}
                  </a>
                </div>
              )}

              {/* Email */}
              {company.contacts.email && (
                <div className="flex items-center mb-4 text-gray-700">
                  <Mail size={18} className="mr-3 text-pink-600" />
                  <a href={`mailto:${company.contacts.email}`} className="hover:text-pink-600 transition-colors break-all">
                    {company.contacts.email}
                  </a>
                </div>
              )}

              {/* Website */}
              {company.contacts.website && (
                <div className="flex items-center mb-6 text-gray-700">
                  <Globe size={18} className="mr-3 text-pink-600" />
                  <a
                    href={company.contacts.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-pink-600 transition-colors break-all"
                  >
                    {language === 'uk' ? 'Веб-сайт' : 'Веб-сайт'}
                  </a>
                </div>
              )}

              {/* Contact Button */}
              <button className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold flex items-center justify-center space-x-2">
                <MessageCircle size={20} />
                <span>{t('common.sendMessage')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetail;