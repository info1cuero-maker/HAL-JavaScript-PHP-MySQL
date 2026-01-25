/**
 * HAL.in.ua Clone - Main JavaScript
 * Vanilla JS Application
 */

// Configuration
const CONFIG = {
    API_URL: '/api',
    DEFAULT_LANG: 'uk'
};

// State
const state = {
    language: localStorage.getItem('hal_lang') || CONFIG.DEFAULT_LANG,
    user: JSON.parse(localStorage.getItem('hal_user')) || null,
    token: localStorage.getItem('hal_token') || null
};

// Translations
const translations = {
    uk: {
        nav: {
            home: 'Головна',
            search: 'Пошук',
            blog: 'Блог',
            contacts: 'Контакти',
            about: 'Про нас',
            login: 'Увійти',
            register: 'Реєстрація',
            dashboard: 'Кабінет',
            logout: 'Вийти'
        },
        hero: {
            title: 'Знайдіть найкращі послуги',
            title2: 'у вашому місті',
            subtitle: 'Каталог компаній та послуг України. Відгуки, рейтинги, контакти.',
            addCompany: 'Додати компанію',
            toCatalog: 'До каталогу'
        },
        sections: {
            newCompanies: 'Нові компанії',
            mainCategories: 'Головні категорії',
            viewMore: 'Дивитись більше',
            new: 'Нове'
        },
        search: {
            placeholder: 'Шукати послугу...',
            allCategories: 'Всі категорії',
            sortBy: 'Сортування',
            recent: 'Нові',
            popular: 'Популярні',
            rating: 'За рейтингом',
            found: 'Знайдено',
            companies: 'компаній',
            nothingFound: 'Нічого не знайдено'
        },
        company: {
            backToSearch: 'Назад до пошуку',
            contactInfo: 'Контактна інформація',
            sendMessage: 'Надіслати повідомлення',
            reviews: 'Відгуки',
            noReviews: 'Відгуків поки немає',
            phone: 'Телефон',
            email: 'Email',
            website: 'Веб-сайт',
            address: 'Адреса'
        },
        footer: {
            desc: 'Каталог компаній та послуг України',
            navigation: 'Навігація',
            categories: 'Категорії',
            contacts: 'Контакти',
            rights: 'Всі права захищені'
        },
        blog: {
            title: 'Блог',
            readMore: 'Читати далі'
        },
        contacts: {
            title: 'Контакти',
            name: 'Ваше ім\'я',
            email: 'Email',
            message: 'Повідомлення',
            send: 'Надіслати',
            success: 'Повідомлення надіслано!'
        },
        about: {
            title: 'Про нас',
            text: 'HAL - це сучасний каталог компаній та послуг України. Ми допомагаємо людям знаходити найкращі послуги у своєму місті.'
        }
    },
    ru: {
        nav: {
            home: 'Главная',
            search: 'Поиск',
            blog: 'Блог',
            contacts: 'Контакты',
            about: 'О нас',
            login: 'Войти',
            register: 'Регистрация',
            dashboard: 'Кабинет',
            logout: 'Выйти'
        },
        hero: {
            title: 'Найдите лучшие услуги',
            title2: 'в вашем городе',
            subtitle: 'Каталог компаний и услуг Украины. Отзывы, рейтинги, контакты.',
            addCompany: 'Добавить компанию',
            toCatalog: 'В каталог'
        },
        sections: {
            newCompanies: 'Новые компании',
            mainCategories: 'Главные категории',
            viewMore: 'Смотреть больше',
            new: 'Новое'
        },
        search: {
            placeholder: 'Искать услугу...',
            allCategories: 'Все категории',
            sortBy: 'Сортировка',
            recent: 'Новые',
            popular: 'Популярные',
            rating: 'По рейтингу',
            found: 'Найдено',
            companies: 'компаний',
            nothingFound: 'Ничего не найдено'
        },
        company: {
            backToSearch: 'Назад к поиску',
            contactInfo: 'Контактная информация',
            sendMessage: 'Отправить сообщение',
            reviews: 'Отзывы',
            noReviews: 'Отзывов пока нет',
            phone: 'Телефон',
            email: 'Email',
            website: 'Веб-сайт',
            address: 'Адрес'
        },
        footer: {
            desc: 'Каталог компаний и услуг Украины',
            navigation: 'Навигация',
            categories: 'Категории',
            contacts: 'Контакты',
            rights: 'Все права защищены'
        },
        blog: {
            title: 'Блог',
            readMore: 'Читать далее'
        },
        contacts: {
            title: 'Контакты',
            name: 'Ваше имя',
            email: 'Email',
            message: 'Сообщение',
            send: 'Отправить',
            success: 'Сообщение отправлено!'
        },
        about: {
            title: 'О нас',
            text: 'HAL - это современный каталог компаний и услуг Украины. Мы помогаем людям находить лучшие услуги в своем городе.'
        }
    }
};

// Translation helper
function t(key) {
    const keys = key.split('.');
    let value = translations[state.language];
    for (const k of keys) {
        value = value?.[k];
    }
    return value || key;
}

// API Helper
const api = {
    async request(endpoint, options = {}) {
        const url = CONFIG.API_URL + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Try to parse JSON
            let data;
            const contentType = response.headers.get('content-type');
            const text = await response.text();
            
            if (contentType && contentType.includes('application/json') && text) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('JSON parse error:', text.substring(0, 200));
                    throw new Error('Помилка сервера: некоректний JSON');
                }
            } else if (text) {
                // Non-JSON response
                console.error('Non-JSON response:', text.substring(0, 200));
                throw new Error('Помилка сервера: очікувався JSON');
            } else {
                data = {};
            }
            
            if (!response.ok) {
                // Handle 401 Unauthorized - maybe token expired
                if (response.status === 401) {
                    console.warn('Unauthorized - token may be expired');
                }
                throw new Error(data.error || `Помилка ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    
    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
};

// ==================== SEO MANAGER ====================

/**
 * Динамічне завантаження SEO-тегів зі сторінки
 */
const SEO = {
    /**
     * Завантажити та застосувати SEO-теги для поточної сторінки
     */
    async loadPageSeo(pageSlug) {
        try {
            const data = await api.get(`/pages/${pageSlug}`);
            this.apply(data);
        } catch (error) {
            console.warn('Failed to load page SEO:', error);
        }
    },
    
    /**
     * Завантажити SEO для категорії
     */
    async loadCategorySeo(category) {
        if (category.meta_title_uk || category.meta_title_ru) {
            this.apply({
                meta_title_uk: category.meta_title_uk,
                meta_title_ru: category.meta_title_ru,
                meta_description_uk: category.meta_description_uk,
                meta_description_ru: category.meta_description_ru,
                meta_keywords_uk: category.meta_keywords_uk,
                meta_keywords_ru: category.meta_keywords_ru
            });
        }
    },
    
    /**
     * Завантажити SEO для компанії
     */
    async loadCompanySeo(company) {
        const lang = state.language;
        const name = lang === 'uk' ? company.name : (company.name_ru || company.name);
        
        // Використати кастомні SEO або згенерувати з даних компанії
        const title = (lang === 'uk' ? company.meta_title_uk : company.meta_title_ru) || `${name} - HAL`;
        const description = (lang === 'uk' ? company.meta_description_uk : company.meta_description_ru) || 
            `${name}. ${company.city}, ${company.address}. Телефон: ${company.phone}`;
        const keywords = (lang === 'uk' ? company.meta_keywords_uk : company.meta_keywords_ru) || 
            `${name}, ${company.city}, ${company.category_name || ''}`;
        
        this.set(title, description, keywords);
    },
    
    /**
     * Завантажити SEO для статті блогу
     */
    async loadBlogPostSeo(post) {
        const lang = state.language;
        const title = lang === 'uk' ? post.title_uk : post.title_ru;
        
        const metaTitle = (lang === 'uk' ? post.meta_title_uk : post.meta_title_ru) || `${title} - HAL Блог`;
        const metaDesc = (lang === 'uk' ? post.meta_description_uk : post.meta_description_ru) || 
            (lang === 'uk' ? post.excerpt_uk : post.excerpt_ru);
        const metaKeywords = (lang === 'uk' ? post.meta_keywords_uk : post.meta_keywords_ru) || '';
        
        this.set(metaTitle, metaDesc, metaKeywords);
    },
    
    /**
     * Застосувати SEO-дані
     */
    apply(data) {
        const lang = state.language;
        const title = lang === 'uk' ? data.meta_title_uk : data.meta_title_ru;
        const description = lang === 'uk' ? data.meta_description_uk : data.meta_description_ru;
        const keywords = lang === 'uk' ? data.meta_keywords_uk : data.meta_keywords_ru;
        
        this.set(title, description, keywords);
    },
    
    /**
     * Встановити SEO-теги
     */
    set(title, description, keywords) {
        // Title
        if (title) {
            document.title = title;
        }
        
        // Meta Description
        if (description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = description;
        }
        
        // Meta Keywords
        if (keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.name = 'keywords';
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.content = keywords;
        }
        
        // Open Graph
        this.setOG('og:title', title);
        this.setOG('og:description', description);
    },
    
    /**
     * Встановити Open Graph тег
     */
    setOG(property, content) {
        if (!content) return;
        
        let ogTag = document.querySelector(`meta[property="${property}"]`);
        if (!ogTag) {
            ogTag = document.createElement('meta');
            ogTag.setAttribute('property', property);
            document.head.appendChild(ogTag);
        }
        ogTag.content = content;
    },
    
    /**
     * Автоматичне визначення сторінки за URL та завантаження SEO
     */
    async autoLoad() {
        const path = window.location.pathname;
        
        // Визначити slug сторінки
        let pageSlug = 'home';
        
        if (path === '/' || path === '/index.html') {
            pageSlug = 'home';
        } else if (path.startsWith('/search')) {
            pageSlug = 'search';
        } else if (path === '/blog' || path === '/blog.html') {
            pageSlug = 'blog';
        } else if (path.startsWith('/about')) {
            pageSlug = 'about';
        } else if (path.startsWith('/contacts')) {
            pageSlug = 'contacts';
        } else {
            // Для динамічних сторінок (компанії, статті) SEO завантажується окремо
            return;
        }
        
        await this.loadPageSeo(pageSlug);
    }
};

// Автозавантаження SEO при готовності DOM
document.addEventListener('DOMContentLoaded', () => {
    SEO.autoLoad();
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(state.language === 'uk' ? 'uk-UA' : 'ru-RU');
}

function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let html = '';
    
    for (let i = 0; i < fullStars; i++) {
        html += '★';
    }
    if (hasHalf) {
        html += '☆';
    }
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) {
        html += '☆';
    }
    
    return html;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function setUrlParam(name, value) {
    const params = new URLSearchParams(window.location.search);
    if (value) {
        params.set(name, value);
    } else {
        params.delete(name);
    }
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.pushState({}, '', newUrl);
}

// Language switching
function setLanguage(lang) {
    state.language = lang;
    localStorage.setItem('hal_lang', lang);
    
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Re-render page content
    if (typeof renderPage === 'function') {
        renderPage();
    }
}

// Auth functions
function setAuth(user, token) {
    state.user = user;
    state.token = token;
    localStorage.setItem('hal_user', JSON.stringify(user));
    localStorage.setItem('hal_token', token);
    updateAuthUI();
}

function logout() {
    state.user = null;
    state.token = null;
    localStorage.removeItem('hal_user');
    localStorage.removeItem('hal_token');
    updateAuthUI();
    window.location.href = '/';
}

function updateAuthUI() {
    const authLinks = document.querySelector('.auth-links');
    if (!authLinks) return;
    
    if (state.user) {
        authLinks.innerHTML = `
            <a href="/dashboard" class="nav-link">${t('nav.dashboard')}</a>
            <button onclick="logout()" class="btn btn-outline">${t('nav.logout')}</button>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="/login" class="btn btn-outline">${t('nav.login')}</a>
            <a href="/register" class="btn btn-primary">${t('nav.register')}</a>
        `;
    }
}

// Company card component
function renderCompanyCard(company) {
    const name = state.language === 'uk' ? company.name : (company.name_ru || company.name);
    const isNew = company.is_new;
    const rating = parseFloat(company.rating) || 0;
    const reviewCount = parseInt(company.review_count) || 0;
    const address = company.address || '';
    const city = company.city || '';
    
    // Default image if not set
    const image = company.image || 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=300&fit=crop';
    
    return `
        <a href="/company/${company.id}" class="company-card">
            <div class="card-image">
                <img src="${image}" alt="${name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=300&fit=crop'">
                ${isNew ? `<span class="card-badge">${t('sections.new')}</span>` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${name}</h3>
                <div class="card-rating">
                    <span class="stars">${renderStars(rating)}</span>
                    <span class="rating-value">${rating.toFixed(1)}</span>
                    <span class="rating-count">(${reviewCount})</span>
                </div>
                <div class="card-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${city}${address ? ', ' + address.substring(0, 25) + (address.length > 25 ? '...' : '') : ''}
                </div>
            </div>
        </a>
    `;
}

// Category card component
function renderCategoryCard(category) {
    const name = state.language === 'uk' ? category.nameUk : category.nameRu;
    const count = category.count || 0;
    const icons = {
        utensils: '🍽️',
        dumbbell: '💪',
        sparkles: '✨',
        palette: '🎨',
        home: '🏠',
        car: '🚗',
        hammer: '🔨',
        'more-horizontal': '📦',
        folder: '📁'
    };
    
    return `
        <a href="/search?category=${category.id}" class="category-card">
            <div class="category-icon">${icons[category.icon] || icons[category.slug] || '📦'}</div>
            <div class="category-name">${name}</div>
            <div class="category-count">${count} ${state.language === 'uk' ? 'компаній' : 'компаний'}</div>
        </a>
    `;
}

// Blog card component
function renderBlogCard(post) {
    const title = state.language === 'uk' ? post.title_uk : post.title_ru;
    const excerpt = state.language === 'uk' ? post.excerpt_uk : post.excerpt_ru;
    const image = post.image || post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop';
    const author = post.author || 'HAL';
    const date = post.published_at || post.created_at;
    
    return `
        <a href="/blog/${post.slug || post.id}" class="blog-card">
            <div class="blog-image">
                <img src="${image}" alt="${title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop'">
            </div>
            <div class="blog-body">
                <h3 class="blog-title">${title}</h3>
                <p class="blog-excerpt">${excerpt}</p>
                <div class="blog-meta">
                    <span>${author}</span>
                    <span>${formatDate(date)}</span>
                </div>
            </div>
        </a>
    `;
}

// Review component
function renderReview(review) {
    const comment = state.language === 'uk' ? review.comment : (review.comment_ru || review.comment);
    
    return `
        <div class="review-card">
            <div class="review-header">
                <span class="review-author">${review.user_name}</span>
                <span class="review-date">${formatDate(review.created_at)}</span>
            </div>
            <div class="review-stars">${renderStars(review.rating)}</div>
            <p class="review-text">${comment}</p>
        </div>
    `;
}

// Loading skeleton
function renderSkeleton(type = 'card', count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        if (type === 'card') {
            html += '<div class="company-card skeleton" style="height: 280px"></div>';
        } else if (type === 'category') {
            html += '<div class="category-card skeleton" style="height: 150px"></div>';
        }
    }
    return html;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Set initial language
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === state.language);
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
    
    // Update auth UI
    updateAuthUI();
});

// Export for use in other files
window.HAL = {
    api,
    state,
    t,
    setLanguage,
    setAuth,
    logout,
    showToast,
    getUrlParam,
    setUrlParam,
    formatDate,
    renderStars,
    renderCompanyCard,
    renderCategoryCard,
    renderBlogCard,
    renderReview,
    renderSkeleton,
    SEO
};
