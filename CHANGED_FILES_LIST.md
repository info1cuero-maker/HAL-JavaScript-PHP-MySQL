# Список изменённых файлов для HAL CMS

## Дата: 26 января 2026

---

## 📁 Полный список файлов для обновления:

### Корневые файлы:
1. **`.htaccess`** - URL rewriting, передача Authorization header

### API Config:
2. **`api/config/config.php`** - Глобальная конфигурация PHP
3. **`api/config/database.php`** - Подключение к MySQL/MariaDB

### API Database:
4. **`api/database/schema.sql`** - Полная схема БД со всеми таблицами

### API Helpers:
5. **`api/helpers/jwt.php`** - JWT авторизация
6. **`api/helpers/response.php`** - JSON Response helper

### JavaScript:
7. **`assets/js/app.js`** - Основной JS (API, переводы, SEO, компоненты)
8. **`assets/js/admin.js`** - JavaScript админ-панели

### HTML:
9. **`company.html`** - Страница компании с Google Maps

---

## ⚙️ Настройки базы данных

**Учётные данные MySQL:**
```
Host: localhost
Database: hal_db
Username: hal_user
Password: hal_password_123
```

**Создание базы данных:**
```sql
CREATE DATABASE IF NOT EXISTS hal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'hal_user'@'localhost' IDENTIFIED BY 'hal_password_123';
GRANT ALL PRIVILEGES ON hal_db.* TO 'hal_user'@'localhost';
FLUSH PRIVILEGES;
```

**Применить схему:**
```bash
mysql -u hal_user -phal_password_123 hal_db < api/database/schema.sql
```

---

## 👤 Учётные записи по умолчанию

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@hal.ua | password |
| Analyst | analyst@hal.ua | password |

---

## 🗺️ Google Maps

Демо-ключ уже встроен в `company.html`:
```
AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8
```

Можно заменить в админ-панели: **Налаштування → Google Maps API Key**

---

## 📋 Требования к серверу

- Apache 2.4+ с mod_rewrite
- PHP 8.0+ с расширениями: pdo_mysql, mbstring, json
- MySQL 5.7+ или MariaDB 10.3+
