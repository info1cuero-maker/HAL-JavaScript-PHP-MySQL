import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CompanyCard = ({ company }) => {
  const { language, t } = useLanguage();
  const name = language === 'uk' ? company.name : company.nameRu;

  return (
    <div className="bg-white rounded-lg overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <Link to={`/company/${company.id}`} className="block relative overflow-hidden">
        <div className="aspect-[4/3] relative">
          <img
            src={company.image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/company/${company.id}`}>
          <h3 className="text-base font-medium text-gray-900 mb-3 hover:text-gray-600 transition-colors line-clamp-2 min-h-[3rem]">
            {name}
          </h3>
        </Link>

        {/* Icons */}
        <div className="flex items-center gap-3 text-gray-600">
          <button className="hover:text-pink-600 transition-colors">
            <MessageCircle size={18} strokeWidth={1.5} />
          </button>
          <button className="hover:text-pink-600 transition-colors">
            <MapPin size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyCard;