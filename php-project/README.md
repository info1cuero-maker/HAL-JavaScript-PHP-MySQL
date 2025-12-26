# HAL.in.ua Clone

<p align="center">
  <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=400&fit=crop" alt="HAL Banner" width="100%">
</p>

<p align="center">
  <strong>🇺🇦 Каталог компаній та послуг України</strong><br>
  <em>Клон сайту hal.in.ua на PHP + MySQL + Vanilla JavaScript</em>
</p>

<p align="center">
  <a href="#features">Функції</a> •
  <a href="#demo">Демо</a> •
  <a href="#installation">Встановлення</a> •
  <a href="#api">API</a> •
  <a href="#license">Ліцензія</a>
</p>

---

## ✨ Features

- 🏢 **Каталог компаній** - перегляд, пошук, фільтрація
- 🔍 **Розумний пошук** - по категоріях з динамічними URL
- 🖼️ **Галерея зображень** - до 10 фото на компанію
- 🗺️ **Карта** - відображення локації компанії (OpenStreetMap)
- ⭐ **Відгуки та рейтинги** - система оцінювання компаній
- 👤 **Особистий кабінет** - статистика переглядів та відгуків
- 📝 **Блог** - статті та новини
- 🌐 **Двомовність** - українська та російська мови
- 📱 **Адаптивний дизайн** - працює на всіх пристроях

## 🛠️ Tech Stack

| Backend | Frontend | Database |
|---------|----------|----------|
| PHP 7.4+ | Vanilla JavaScript | MySQL 5.7+ |
| REST API | HTML5 / CSS3 | MariaDB 10.3+ |
| JWT Auth | Responsive Design | |

## 📦 Installation

### Вимоги
- PHP 7.4 або вище (рекомендується 8.0+)
- MySQL 5.7+ або MariaDB 10.3+
- Apache з mod_rewrite або Nginx
- Composer (опціонально)

### Крок 1: Клонування репозиторію
```bash
git clone https://github.com/yourusername/hal-clone.git
cd hal-clone
```

### Крок 2: Налаштування бази даних
```sql
CREATE DATABASE hal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u your_username -p hal_db < api/database/schema.sql
```

### Крок 3: Конфігурація
Відредагуйте файл `api/config/database.php`:
```php
private $host = 'localhost';
private $db_name = 'hal_db';
private $username = 'your_username';
private $password = 'your_password';
```

### Крок 4: Наповнення даними (опціонально)
```bash
cd api/database
php seed.php
```

### Крок 5: Налаштування веб-сервера

#### Apache
Переконайтеся, що mod_rewrite увімкнено:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/hal-clone;
    index index.html;

    location /api {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

## 📂 Project Structure

```
hal-clone/
├── api/                      # PHP Backend
│   ├── config/
│   │   ├── config.php       # App configuration
│   │   └── database.php     # Database connection
│   ├── controllers/
│   │   ├── AuthController.php
│   │   ├── CompanyController.php
│   │   ├── CategoryController.php
│   │   ├── ReviewController.php
│   │   ├── BlogController.php
│   │   ├── UserController.php
│   │   └── ContactController.php
│   ├── database/
│   │   ├── schema.sql       # Database schema
│   │   └── seed.php         # Sample data
│   ├── helpers/
│   │   ├── jwt.php          # JWT authentication
│   │   └── response.php     # JSON responses
│   ├── index.php            # API entry point
│   └── .htaccess
├── assets/
│   ├── css/
│   │   └── style.css        # Main stylesheet
│   └── js/
│       └── app.js           # Main JavaScript
├── index.html               # Homepage
├── search.html              # Search page
├── company.html             # Company detail page
├── blog.html                # Blog listing
├── blog-post.html           # Blog post page
├── contacts.html            # Contact page
├── about.html               # About page
├── login.html               # Login page
├── register.html            # Registration page
├── dashboard.html           # User dashboard
├── add-business.html        # Add company form
├── .htaccess                # Apache routing
├── .gitignore
├── LICENSE
└── README.md
```

## 🔌 API Reference

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | Get all companies |
| GET | `/api/companies?category=cafe` | Filter by category |
| GET | `/api/companies?search=торт` | Search companies |
| GET | `/api/companies/{id}` | Get company details |
| POST | `/api/companies` | Create company (auth required) |
| PUT | `/api/companies/{id}` | Update company (auth required) |
| DELETE | `/api/companies/{id}` | Delete company (auth required) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user (auth required) |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies/{id}/reviews` | Get company reviews |
| POST | `/api/companies/{id}/reviews` | Add review (auth required) |

### Blog

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog` | Get all posts |
| GET | `/api/blog/{id}` | Get post by ID |

### Contact

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Send contact message |

## 🌍 Internationalization

The application supports two languages:
- 🇺🇦 Ukrainian (default)
- 🇷🇺 Russian

Language can be switched using the language toggle in the header. User preference is saved in localStorage.

## 🔐 Security

Before deploying to production:

1. **Change JWT Secret** in `api/config/config.php`:
```php
define('JWT_SECRET', 'your-very-long-random-secret-key');
```

2. **Secure database credentials** - use environment variables if possible

3. **Disable error display** in production:
```php
ini_set('display_errors', 0);
```

4. **Use HTTPS** - enable SSL certificate

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

### Homepage
![Homepage](https://via.placeholder.com/800x400?text=Homepage)

### Search Page
![Search](https://via.placeholder.com/800x400?text=Search+Page)

### Company Detail
![Company](https://via.placeholder.com/800x400?text=Company+Detail)

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=Dashboard)

</details>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original design inspiration from [hal.in.ua](https://hal.in.ua)
- Icons from [Lucide Icons](https://lucide.dev)
- Images from [Unsplash](https://unsplash.com)

---

<p align="center">
  Made with ❤️ in Ukraine 🇺🇦
</p>
