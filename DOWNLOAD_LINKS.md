# 📥 ПРЯМЫЕ ССЫЛКИ ДЛЯ СКАЧИВАНИЯ ФАЙЛОВ

## Ваш сайт доступен по адресу:
**Frontend:** https://ukrbizdir.preview.emergentagent.com
**Страница скачивания:** https://ukrbizdir.preview.emergentagent.com/download

---

## 🔗 ПРЯМЫЕ ССЫЛКИ ДЛЯ СКАЧИВАНИЯ:

### Кликните правой кнопкой → "Сохранить ссылку как..."

1. **Компании (CSV для WP All Import)** ⭐ РЕКОМЕНДУЕТСЯ
   ```
   https://ukrbizdir.preview.emergentagent.com/api/download/companies_for_wordpress.csv
   ```

2. **Статьи блога (CSV для WP All Import)** ⭐ РЕКОМЕНДУЕТСЯ
   ```
   https://ukrbizdir.preview.emergentagent.com/api/download/blog_posts_for_wordpress.csv
   ```

3. **Полный экспорт (WordPress XML)**
   ```
   https://ukrbizdir.preview.emergentagent.com/api/download/hal_wordpress_export.xml
   ```

4. **Компании (JSON)**
   ```
   https://ukrbizdir.preview.emergentagent.com/api/download/companies.json
   ```

5. **Статьи блога (JSON)**
   ```
   https://ukrbizdir.preview.emergentagent.com/api/download/blog_posts.json
   ```

---

## 📱 КАК СКАЧАТЬ:

### Вариант 1: Через браузер (Просто)
1. Откройте эту ссылку в браузере:
   ```
   https://ukrbizdir.preview.emergentagent.com/download
   ```
2. Нажмите кнопку "Завантажити" возле нужного файла

### Вариант 2: Прямая ссылка (Быстро)
Просто кликните на любую из ссылок выше - файл скачается автоматически

### Вариант 3: Через curl (Для терминала)
```bash
# Скачать все файлы одной командой
curl -O https://ukrbizdir.preview.emergentagent.com/api/download/companies_for_wordpress.csv
curl -O https://ukrbizdir.preview.emergentagent.com/api/download/blog_posts_for_wordpress.csv
curl -O https://ukrbizdir.preview.emergentagent.com/api/download/hal_wordpress_export.xml
curl -O https://ukrbizdir.preview.emergentagent.com/api/download/companies.json
curl -O https://ukrbizdir.preview.emergentagent.com/api/download/blog_posts.json
```

---

## 🎯 ЧТО ДЕЛАТЬ ДАЛЬШЕ:

### Шаг 1: Скачайте файлы
Скачайте файлы по ссылкам выше на свой компьютер

### Шаг 2: Установите плагин в WordPress
1. Войдите в WordPress Admin панель
2. Плагины → Добавить новый
3. Найдите **"WP All Import"**
4. Установите и активируйте

### Шаг 3: Импортируйте данные
1. В WordPress Admin: **All Import** → **New Import**
2. Нажмите **"Upload a file"**
3. Выберите скачанный файл `companies_for_wordpress.csv`
4. Следуйте инструкциям мастера импорта
5. Повторите для `blog_posts_for_wordpress.csv`

---

## ❓ ПРОБЛЕМЫ?

### Ссылка не работает?
Попробуйте:
1. Открыть в режиме инкогнито
2. Очистить кеш браузера
3. Использовать другой браузер

### Файл не скачивается?
1. Проверьте что backend работает:
   ```
   https://ukrbizdir.preview.emergentagent.com/api/
   ```
   Должно показать: `{"message":"HAL API v1.0"}`

2. Если не работает - файлы также доступны на сервере в папке:
   ```
   /app/backend/wordpress_export/
   ```

---

## 📚 ДОКУМЕНТАЦИЯ

Подробные инструкции смотрите в файлах:
- `/app/QUICKSTART_WORDPRESS.md` - быстрый старт
- `/app/WORDPRESS_UPLOAD_GUIDE.md` - детальное руководство
- `/app/MIGRATION_GUIDE.md` - полная миграция

---

## 📊 ЧТО В ФАЙЛАХ:

- **companies_for_wordpress.csv** (4.6 KB)
  - 10 компаний с контактами
  - Готово для WP All Import
  
- **blog_posts_for_wordpress.csv** (1.3 KB)
  - 2 статьи блога
  - С изображениями и датами
  
- **hal_wordpress_export.xml** (12 KB)
  - Все данные в стандартном WordPress формате
  
- **companies.json** (9.0 KB)
  - JSON формат для программного импорта
  
- **blog_posts.json** (1.7 KB)
  - JSON формат статей
