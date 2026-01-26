# HAL - Каталог компаний Украины

## Стек технологий
- **Backend**: PHP 8.2 + MariaDB/MySQL
- **Frontend**: Vanilla JavaScript + HTML + CSS
- **Server**: Apache 2.4

## Структура проекта
```
/app
├── api/                    # PHP Backend
│   ├── config/            # Конфигурация (database.php, config.php)
│   ├── controllers/       # Контроллеры API
│   ├── database/          # SQL схема и сиды
│   ├── helpers/           # JWT, Response helpers
│   └── index.php          # API Router
├── assets/
│   ├── css/style.css      # Стили
│   └── js/
│       ├── app.js         # Общий JS
│       └── admin.js       # Админ-панель JS
├── *.html                  # HTML страницы
└── .htaccess              # URL rewriting
```

## Реализованный функционал

### Публичные страницы
- [x] Главная страница (index.html)
- [x] Поиск компаний с фильтрами (search.html)
- [x] Страница компании с Google Maps (company.html)
- [x] Блог с категориями (blog.html, blog-post.html)
- [x] Контакты (contacts.html)
- [x] О нас (about.html)
- [x] Авторизация/Регистрация (login.html, register.html)

### Админ-панель (admin.html)
- [x] Dashboard со статистикой
- [x] Управление категориями (с подкатегориями)
- [x] Управление компаниями (CRUD + изображения .webp)
- [x] Управление блогом (категории + статьи)
- [x] Модерация отзывов
- [x] Управление пользователями (роли: admin, analyst, user)
- [x] SEO-настройки для всех страниц
- [x] Системные настройки (включая Google Maps API Key)
- [x] Логи действий администраторов

### Личный кабинет (dashboard.html)
- [x] Статистика компании пользователя
- [x] Фильтр по датам (7/30/90 дней, год)
- [x] График просмотров
- [x] Редактирование профиля

### API Endpoints
- `/api/auth/*` - авторизация
- `/api/companies/*` - компании (публичные)
- `/api/categories/*` - категории
- `/api/blog/*` - блог
- `/api/admin/*` - админ-эндпоинты
- `/api/users/me/*` - личный кабинет

## Учётные данные
- **Admin**: admin@hal.ua / password
- **Analyst**: analyst@hal.ua / password
- **DB**: hal_user / hal_password_123 / hal_db

## Интеграции
- **Google Maps Embed API** - демо-ключ встроен, можно заменить в настройках

## Дата последнего обновления
26 января 2026

## Backlog (P2-P3)
- [ ] Наполнение базы тестовыми данными (seed.php)
- [ ] Email уведомления
- [ ] Расширенная аналитика
- [ ] Экспорт данных в CSV/Excel
