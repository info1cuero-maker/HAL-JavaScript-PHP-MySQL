# HAL.in.ua Clone - PHP + MySQL + Vanilla JS

## Описание / Опис
Это клон сайта hal.in.ua, написанный на PHP, MySQL и Vanilla JavaScript.
Це клон сайту hal.in.ua, написаний на PHP, MySQL та Vanilla JavaScript.

## Требования / Вимоги
- PHP 7.4+ (рекомендуется 8.0+)
- MySQL 5.7+ или MariaDB 10.3+
- Apache или Nginx с поддержкой mod_rewrite

## Установка / Встановлення

### 1. База данных / База даних
```sql
-- Создайте базу данных
CREATE DATABASE hal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Импортируйте схему
mysql -u root -p hal_db < database/schema.sql
```

### 2. Конфигурация / Конфігурація
Отредактируйте файл `api/config/database.php` и укажите ваши данные:
```php
private $host = 'localhost';
private $db_name = 'hal_db';
private $username = 'your_username';
private $password = 'your_password';
```

### 3. Наполнение данными / Наповнення даними
```bash
cd api/database
php seed.php
```

### 4. Настройка Apache (.htaccess)
Убедитесь, что mod_rewrite включен и .htaccess разрешен.

### 5. Запуск / Запуск
Загрузите все файлы на хостинг. Структура:
```
public_html/
├── api/            # PHP Backend
├── assets/         # CSS, JS
├── index.html      # Главная страница
├── search.html     # Поиск
├── company.html    # Страница компании
├── blog.html       # Блог
├── contacts.html   # Контакты
├── about.html      # О нас
└── .htaccess       # Роутинг
```

## API Endpoints

### Компании
- `GET /api/companies` - список компаний
- `GET /api/companies/{id}` - детали компании
- `POST /api/companies` - создать компанию (требует авторизации)

### Авторизация
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/me` - текущий пользователь

### Категории
- `GET /api/categories` - список категорий

### Отзывы
- `GET /api/companies/{id}/reviews` - отзывы компании
- `POST /api/companies/{id}/reviews` - добавить отзыв

### Блог
- `GET /api/blog` - статьи блога
- `GET /api/blog/{id}` - статья

### Контакты
- `POST /api/contact` - отправить сообщение

## Лицензия / Ліцензія
MIT License
