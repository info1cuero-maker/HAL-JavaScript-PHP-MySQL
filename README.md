# HAL - Каталог компаній та послуг України

Клон сайту hal.in.ua на PHP + MySQL + Vanilla JavaScript.

## Технологічний стек

- **Backend**: PHP 8.x
- **Database**: MySQL / MariaDB
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Авторизація**: JWT токени

## Вимоги

- PHP 8.0 або новіше
- MySQL 5.7+ або MariaDB 10.3+
- Apache з mod_rewrite або Nginx
- PHP розширення: pdo_mysql, json, mbstring

## Встановлення

### 1. Клонування репозиторію

```bash
git clone https://github.com/your-username/hal-clone.git
cd hal-clone
```

### 2. Налаштування бази даних

1. Створіть базу даних MySQL:
```sql
CREATE DATABASE hal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Імпортуйте схему:
```bash
mysql -u root -p hal_db < api/database/schema.sql
```

### 3. Налаштування конфігурації

Відредагуйте файл `api/config/database.php`:

```php
private $host = 'localhost';
private $db_name = 'hal_db';
private $username = 'your_mysql_user';
private $password = 'your_mysql_password';
```

### 4. Налаштування веб-сервера

#### Apache

Переконайтеся, що mod_rewrite увімкнено. Файл `.htaccess` вже налаштований.

```apache
<VirtualHost *:80>
    DocumentRoot /var/www/hal
    ServerName hal.local
    
    <Directory /var/www/hal>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name hal.local;
    root /var/www/hal;
    index index.html index.php;

    location / {
        try_files $uri $uri/ @rewrite;
    }

    location @rewrite {
        rewrite ^/api/(.*)$ /api/index.php last;
        rewrite ^/search$ /search.html last;
        rewrite ^/company/(.*)$ /company.html last;
        rewrite ^/blog$ /blog.html last;
        rewrite ^/blog/(.*)$ /blog-post.html last;
        rewrite ^/contacts$ /contacts.html last;
        rewrite ^/about$ /about.html last;
        rewrite ^/login$ /login.html last;
        rewrite ^/register$ /register.html last;
        rewrite ^/dashboard$ /dashboard.html last;
        rewrite ^/admin$ /admin.html last;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. Створення директорії для завантажень

```bash
mkdir -p api/uploads/companies
chmod 755 api/uploads/companies
```

## Структура проекту

```
/
├── api/
│   ├── config/
│   │   ├── config.php      # Глобальна конфігурація
│   │   └── database.php    # Підключення до БД
│   ├── controllers/
│   │   ├── AdminController.php
│   │   ├── AuthController.php
│   │   ├── BlogController.php
│   │   ├── CategoryController.php
│   │   ├── CompanyController.php
│   │   ├── ContactController.php
│   │   ├── HomeController.php
│   │   ├── ReviewController.php
│   │   └── UserController.php
│   ├── database/
│   │   ├── schema.sql      # Схема БД
│   │   └── seed.php        # Тестові дані
│   ├── helpers/
│   │   ├── jwt.php         # JWT авторизація
│   │   └── response.php    # JSON відповіді
│   └── index.php           # API роутер
├── assets/
│   ├── css/
│   │   ├── style.css       # Основні стилі
│   │   └── admin.css       # Стилі адмін-панелі
│   └── js/
│       ├── app.js          # Головний JS
│       └── admin.js        # JS адмін-панелі
├── index.html              # Головна сторінка
├── search.html             # Пошук компаній
├── company.html            # Сторінка компанії
├── blog.html               # Блог
├── blog-post.html          # Стаття блогу
├── contacts.html           # Контакти
├── about.html              # Про нас
├── login.html              # Вхід
├── register.html           # Реєстрація
├── dashboard.html          # Кабінет користувача
├── admin.html              # Адмін-панель
├── add-business.html       # Додати компанію
└── .htaccess               # Налаштування Apache
```

## API Endpoints

### Публічні

| Метод | URL | Опис |
|-------|-----|------|
| GET | /api/companies | Список компаній |
| GET | /api/companies/{id} | Деталі компанії |
| GET | /api/categories | Список категорій |
| GET | /api/cities | Список міст |
| GET | /api/blog | Список статей |
| GET | /api/blog/{id} | Стаття блогу |
| GET | /api/blog/categories | Категорії блогу |
| POST | /api/auth/register | Реєстрація |
| POST | /api/auth/login | Вхід |
| POST | /api/contact | Форма зворотнього зв'язку |

### Адмін-панель (потрібна авторизація)

| Метод | URL | Опис |
|-------|-----|------|
| GET | /api/admin/dashboard | Статистика |
| GET/POST/PUT/DELETE | /api/admin/categories | CRUD категорій |
| GET/POST/PUT/DELETE | /api/admin/companies | CRUD компаній |
| GET/POST/PUT/DELETE | /api/admin/blog | CRUD статей |
| GET/PUT/DELETE | /api/admin/reviews | Модерація відгуків |
| GET/PUT | /api/admin/users | Управління користувачами |
| GET/PUT | /api/admin/settings | Налаштування |

## Ролі користувачів

- **admin** - Повний доступ до CMS
- **analyst** - Тільки перегляд в CMS
- **user** - Може редагувати тільки свої компанії

## Тестовий доступ

Після імпорту схеми БД, створюються тестові користувачі:

- **Admin**: admin@hal.ua / admin123
- **Analyst**: analyst@hal.ua / admin123

## Особливості

- 🌐 Двомовність (Українська/Російська)
- 📱 Адаптивний дизайн
- 🔐 JWT авторизація
- 📁 Ієрархічні категорії з підкатегоріями
- 📍 Фільтрація по містах
- 📊 Пагінація для великих обсягів даних
- ⭐ Модерація відгуків
- 📝 CRUD для контенту
- 🖼️ Завантаження зображень (WebP)

## Ліцензія

MIT
