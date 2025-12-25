import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { mockCompanies, categories } from '../data/mockData';
import CompanyCard from '../components/CompanyCard';
import { ArrowRight, Utensils, Dumbbell, Sparkles, Palette, Home as HomeIcon, Car, Hammer, MoreHorizontal } from 'lucide-react';

const categoryIcons = {
  cafe: Utensils,
  sport: Dumbbell,
  beauty: Sparkles,
  art: Palette,
  home: HomeIcon,
  auto: Car,
  construction: Hammer,
  other: MoreHorizontal
};

const Home = () => {
  const { language, t } = useLanguage();
  const newCompanies = mockCompanies.filter(c => c.isNew).slice(0, 4);
  const allCompanies = mockCompanies.slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&h=1080&fit=crop"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {t('hero.title')}
            <br />
            {t('hero.title2')}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/add-business"
              className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t('hero.addCompany')}
            </Link>
            <Link
              to="/search"
              className="bg-white text-gray-900 px-8 py-4 rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg shadow-lg transform hover:-translate-y-0.5"
            >
              {t('hero.toCatalog')}
            </Link>
          </div>
        </div>
      </section>

      {/* New Companies Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">{t('sections.newCompanies')}</h2>
            <Link
              to="/search"
              className="text-pink-600 hover:text-pink-700 font-medium flex items-center space-x-2 group"
            >
              <span>{t('sections.viewMore')}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            {t('sections.mainCategories')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              return (
                <Link
                  key={category.id}
                  to={`/search?category=${category.id}`}
                  className="group"
                >
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-pink-300 transform hover:-translate-y-1">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={32} className="text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {language === 'uk' ? category.nameUk : category.nameRu}
                      </h3>
                      <p className="text-sm text-gray-500">{category.count} {language === 'uk' ? 'компаній' : 'компаний'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;