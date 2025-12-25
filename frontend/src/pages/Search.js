import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { companiesAPI, categoriesAPI } from '../services/api';
import CompanyCard from '../components/CompanyCard';
import { Search as SearchIcon, Filter, X } from 'lucide-react';

const Search = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevant');
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [searchTerm, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
        sort: sortBy === 'relevant' ? 'recent' : sortBy
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await companiesAPI.getAll(params);
      setCompanies(response.data.companies);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCompanies();
    
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (sortBy !== 'relevant') params.set('sort', sortBy);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Search Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('nav.search')}</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'uk' ? 'Шукати послугу...' : 'Искать услугу...'}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold"
              >
                {t('nav.search')}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter size={20} />
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block space-y-4`}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Category Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'uk' ? 'Категорія' : 'Категория'}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">{language === 'uk' ? 'Всі категорії' : 'Все категории'}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'uk' ? cat.nameUk : cat.nameRu}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'uk' ? 'Сортування' : 'Сортировка'}
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="relevant">{t('footer.relevant')}</option>
                  <option value="pop">{t('footer.popular')}</option>
                  <option value="recent">{t('footer.recentlyAdded')}</option>
                  <option value="rating">{language === 'uk' ? 'За рейтингом' : 'По рейтингу'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            {language === 'uk' ? 'Знайдено' : 'Найдено'}: <span className="font-semibold text-gray-900">{filteredCompanies.length}</span> {language === 'uk' ? 'компаній' : 'компаний'}
          </p>
        </div>

        {/* Companies Grid */}
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              {language === 'uk' ? 'Нічого не знайдено' : 'Ничего не найдено'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;