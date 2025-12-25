import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Download, FileText, FileJson, Code } from 'lucide-react';

const DownloadFiles = () => {
  const { language } = useLanguage();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const files = [
    {
      name: 'companies_for_wordpress.csv',
      title: language === 'uk' ? 'Компанії (CSV для WP All Import)' : 'Компании (CSV для WP All Import)',
      description: language === 'uk' ? '10 компаній у CSV форматі для імпорту через WP All Import' : '10 компаний в CSV формате для импорта через WP All Import',
      icon: FileText,
      size: '4.6 KB'
    },
    {
      name: 'blog_posts_for_wordpress.csv',
      title: language === 'uk' ? 'Статті блогу (CSV)' : 'Статьи блога (CSV)',
      description: language === 'uk' ? '2 статті блогу у CSV форматі' : '2 статьи блога в CSV формате',
      icon: FileText,
      size: '1.3 KB'
    },
    {
      name: 'hal_wordpress_export.xml',
      title: language === 'uk' ? 'Повний експорт (WordPress XML)' : 'Полный экспорт (WordPress XML)',
      description: language === 'uk' ? 'Всі дані у WordPress XML форматі для стандартного імпортера' : 'Все данные в WordPress XML формате для стандартного импортера',
      icon: Code,
      size: '12 KB'
    },
    {
      name: 'companies.json',
      title: language === 'uk' ? 'Компанії (JSON)' : 'Компании (JSON)',
      description: language === 'uk' ? 'JSON формат для custom імпорту або API' : 'JSON формат для custom импорта или API',
      icon: FileJson,
      size: '9.0 KB'
    },
    {
      name: 'blog_posts.json',
      title: language === 'uk' ? 'Статті блогу (JSON)' : 'Статьи блога (JSON)',
      description: language === 'uk' ? 'JSON формат статей блогу' : 'JSON формат статей блога',
      icon: FileJson,
      size: '1.7 KB'
    }
  ];

  const handleDownload = (filename) => {
    window.open(`${BACKEND_URL}/api/download/${filename}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'uk' ? '📦 Завантажити файли для WordPress' : '📦 Скачать файлы для WordPress'}
          </h1>
          <p className="text-gray-600 mb-6">
            {language === 'uk' 
              ? 'Всі файли готові для імпорту в WordPress. Виберіть потрібний формат і завантажте.'
              : 'Все файлы готовы для импорта в WordPress. Выберите нужный формат и скачайте.'}
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h3 className="font-semibold text-blue-900 mb-2">
              {language === 'uk' ? '🎯 Рекомендований спосіб:' : '🎯 Рекомендуемый способ:'}
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>{language === 'uk' ? 'Завантажте CSV файли' : 'Скачайте CSV файлы'}</li>
              <li>
                {language === 'uk' 
                  ? 'Встановіть плагін "WP All Import" в WordPress'
                  : 'Установите плагин "WP All Import" в WordPress'}
              </li>
              <li>
                {language === 'uk'
                  ? 'Імпортуйте файли через All Import → New Import'
                  : 'Импортируйте файлы через All Import → New Import'}
              </li>
            </ol>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-4">
          {files.map((file) => {
            const Icon = file.icon;
            return (
              <div
                key={file.name}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {file.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {file.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{file.name}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-6 py-2.5 rounded-lg hover:from-pink-600 hover:to-red-600 transition-all font-semibold flex items-center space-x-2 shadow-md hover:shadow-lg ml-4"
                  >
                    <Download size={18} />
                    <span>{language === 'uk' ? 'Завантажити' : 'Скачать'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Documentation Links */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {language === 'uk' ? '📚 Документація' : '📚 Документация'}
          </h3>
          <div className="space-y-3">
            <a
              href="https://github.com/your-repo/QUICKSTART_WORDPRESS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-pink-600 hover:text-pink-700 font-medium"
            >
              → {language === 'uk' ? 'Швидкий старт (чек-ліст)' : 'Быстрый старт (чек-лист)'}
            </a>
            <a
              href="https://github.com/your-repo/WORDPRESS_UPLOAD_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-pink-600 hover:text-pink-700 font-medium"
            >
              → {language === 'uk' ? 'Детальна інструкція з імпорту' : 'Детальная инструкция по импорту'}
            </a>
            <a
              href="https://github.com/your-repo/MIGRATION_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-pink-600 hover:text-pink-700 font-medium"
            >
              → {language === 'uk' ? 'Повне керівництво з міграції' : 'Полное руководство по миграции'}
            </a>
          </div>
        </div>

        {/* Need Help */}
        <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-xl shadow-md p-6 mt-8 text-white">
          <h3 className="text-xl font-bold mb-2">
            {language === 'uk' ? '🆘 Потрібна допомога?' : '🆘 Нужна помощь?'}
          </h3>
          <p className="mb-4">
            {language === 'uk'
              ? 'Якщо виникли проблеми з імпортом, перегляньте детальну документацію або зверніться до підтримки.'
              : 'Если возникли проблемы с импортом, посмотрите детальную документацию или обратитесь в поддержку.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/contacts"
              className="bg-white text-pink-600 px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-all font-semibold text-center"
            >
              {language === 'uk' ? 'Зв\'язатися з нами' : 'Связаться с нами'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadFiles;
