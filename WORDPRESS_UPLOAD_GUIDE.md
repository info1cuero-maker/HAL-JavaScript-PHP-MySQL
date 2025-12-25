# Инструкция: Как загрузить данные из HAL в WordPress

## Шаг 1: Экспорт данных из HAL

Запустите скрипт экспорта:

```bash
cd /app/backend
python export_to_wordpress.py
```

Будут созданы файлы в папке `wordpress_export/`:

1. **companies_for_wordpress.csv** - компании в CSV
2. **blog_posts_for_wordpress.csv** - статьи блога в CSV
3. **hal_wordpress_export.xml** - все данные в WordPress XML
4. **companies.json** - компании в JSON
5. **blog_posts.json** - статьи в JSON

## Шаг 2: Выберите метод импорта

### Метод 1: Через плагин WP All Import (Рекомендуется) ⭐

**Это самый простой и надежный способ!**

#### A. Установка плагина

1. Войдите в WordPress Admin панель
2. Перейдите в **Plugins → Add New**
3. Найдите **"WP All Import"**
4. Установите и активируйте плагин

#### B. Импорт компаний

1. В WordPress Admin перейдите в **All Import → New Import**

2. **Загрузите файл:**
   - Нажмите "Upload a file"
   - Выберите файл `companies_for_wordpress.csv`
   - Нажмите "Continue"

3. **Выберите тип поста:**
   - Если у вас есть custom post type "Listing": выберите его
   - Если нет: выберите "Posts" или создайте custom post type

4. **Настройте маппинг полей:**

   Перетащите поля из CSV в соответствующие поля WordPress:

   ```
   CSV Field               →  WordPress Field
   ─────────────────────────────────────────────
   post_title              →  Title
   post_content            →  Content
   post_status             →  Status
   category                →  Categories
   phone                   →  Custom Field: _listing_phone
   email                   →  Custom Field: _listing_email
   website                 →  Custom Field: _listing_website
   city                    →  Custom Field: _listing_city
   address                 →  Custom Field: _listing_address
   image_url               →  Featured Image (from URL)
   rating                  →  Custom Field: _listing_rating
   ```

5. **Для двуязычности (если используете WPML или Polylang):**
   - Создайте два отдельных импорта
   - Первый: используйте `post_title` и `post_content` (украинский)
   - Второй: используйте `post_title_ru` и `post_content_ru` (русский)
   - Свяжите переводы через Translation ID

6. **Нажмите "Continue" и "Confirm & Run Import"**

#### C. Импорт статей блога

1. **All Import → New Import**
2. Загрузите `blog_posts_for_wordpress.csv`
3. Выберите "Posts" как тип
4. Настройте маппинг:
   ```
   post_title              →  Title
   post_content            →  Content
   post_excerpt            →  Excerpt
   post_date               →  Published Date
   post_author             →  Author
   featured_image          →  Featured Image (from URL)
   ```

### Метод 2: Через WordPress Importer (Стандартный)

#### A. Установка

1. **Tools → Import**
2. Выберите **"WordPress"**
3. Установите плагин "WordPress Importer"

#### B. Импорт

1. **Tools → Import → WordPress**
2. Загрузите файл `hal_wordpress_export.xml`
3. Выберите:
   - Download and import file attachments ✓
   - Import authors (создать нового или использовать существующего)
4. Нажмите **"Submit"**

**Примечание:** Этот метод хорош для базового импорта, но может потерять custom fields.

### Метод 3: Через REST API (Программный)

Если нужна автоматизация или большие объемы данных:

```bash
cd /app/backend
python wordpress_api_uploader.py
```

Создам этот скрипт отдельно, если нужно.

### Метод 4: Прямой импорт в MySQL (Для экспертов)

Если у вас есть прямой доступ к базе данных WordPress:

```bash
# Подключитесь к MySQL
mysql -u username -p wordpress_db

# Импортируйте данные в таблицы wp_posts и wp_postmeta
# (требуется custom SQL скрипт)
```

## Шаг 3: Настройка custom post type в WordPress

Если компании хранятся как custom post type "listing":

### A. Через плагин (Рекомендуется)

Установите плагин **"Custom Post Type UI"**:

1. **Plugins → Add New → "Custom Post Type UI"**
2. **CPT UI → Add/Edit Post Types**
3. Создайте новый тип:
   ```
   Post Type Slug: listing
   Plural Label: Listings
   Singular Label: Listing
   ```
4. **Настройте поддержку:**
   - Title ✓
   - Editor ✓
   - Featured Image ✓
   - Custom Fields ✓
   - Categories ✓

### B. Через код (functions.php)

Добавьте в `functions.php` вашей темы:

```php
function create_listing_post_type() {
    register_post_type('listing',
        array(
            'labels' => array(
                'name' => 'Компанії',
                'singular_name' => 'Компанія'
            ),
            'public' => true,
            'has_archive' => true,
            'rewrite' => array('slug' => 'companies'),
            'show_in_rest' => true, // Для REST API
            'supports' => array('title', 'editor', 'thumbnail', 'custom-fields')
        )
    );
}
add_action('init', 'create_listing_post_type');

// Регистрация custom fields
function register_listing_meta_fields() {
    register_meta('post', '_listing_phone', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
    
    register_meta('post', '_listing_email', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'sanitize_email'
    ));
    
    register_meta('post', '_listing_website', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'esc_url_raw'
    ));
    
    register_meta('post', '_listing_city', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
    
    register_meta('post', '_listing_address', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
    
    register_meta('post', '_listing_category', array(
        'show_in_rest' => true,
        'type' => 'string',
        'single' => true,
        'sanitize_callback' => 'sanitize_text_field'
    ));
    
    register_meta('post', '_listing_rating', array(
        'show_in_rest' => true,
        'type' => 'number',
        'single' => true
    ));
}
add_action('init', 'register_listing_meta_fields');
```

## Шаг 4: Настройка категорий

### Создайте taxonomy для категорий:

```php
function create_listing_taxonomy() {
    register_taxonomy('listing_category', 'listing', array(
        'hierarchical' => true,
        'labels' => array(
            'name' => 'Категорії',
            'singular_name' => 'Категорія'
        ),
        'show_in_rest' => true,
        'rewrite' => array('slug' => 'category')
    ));
}
add_action('init', 'create_listing_taxonomy');
```

### Или создайте категории вручную:

1. **Listings → Categories** (или Posts → Categories)
2. Добавьте категории:
   - Кафе та ресторани (cafe)
   - Спорт і фітнес (sport)
   - Краса та здоров'я (beauty)
   - Мистецтво та розваги (art)
   - Домашні послуги (home)
   - Авто послуги (auto)
   - Будівництво (construction)
   - Інші послуги (other)

## Шаг 5: Настройка мультиязычности

### Вариант A: WPML (Платный, профессиональный)

1. Установите плагин **WPML**
2. **WPML → Languages** - добавьте украинский и русский
3. **WPML → Translation Management**
4. Импортируйте сначала украинские версии
5. Затем русские версии, указав их как переводы

### Вариант B: Polylang (Бесплатный)

1. Установите плагин **Polylang**
2. **Languages** - добавьте UA и RU
3. При импорте:
   - Установите язык для каждого поста
   - Свяжите переводы вручную или через API

### Вариант C: Custom решение

Сохраните оба языка в custom fields:
- `_title_ru` - русское название
- `_content_ru` - русское содержание

## Шаг 6: Импорт изображений

### Автоматически (через WP All Import):

При настройке импорта в разделе "Images":
- Выберите "Download images hosted elsewhere"
- Укажите поле `image_url` как источник
- WP All Import скачает изображения в Media Library

### Вручную:

1. Скачайте изображения из MongoDB URLs
2. Загрузите в **Media → Add New**
3. Прикрепите к постам как Featured Image

## Шаг 7: Проверка после импорта

### Чеклист:

- [ ] Все компании импортированы?
  ```
  SELECT COUNT(*) FROM wp_posts WHERE post_type = 'listing';
  ```

- [ ] Custom fields заполнены?
  ```
  SELECT * FROM wp_postmeta WHERE meta_key LIKE '_listing_%';
  ```

- [ ] Изображения загружены?
  ```
  SELECT COUNT(*) FROM wp_posts WHERE post_type = 'attachment';
  ```

- [ ] Категории назначены?
  ```
  SELECT * FROM wp_term_relationships;
  ```

- [ ] Статьи блога импортированы?
  ```
  SELECT COUNT(*) FROM wp_posts WHERE post_type = 'post';
  ```

## Частые проблемы и решения

### Проблема: Custom fields не импортируются

**Решение:**
- Убедитесь что custom fields зарегистрированы в functions.php
- Используйте префикс `_listing_` для всех полей
- В WP All Import выберите "Custom Fields" в маппинге

### Проблема: Изображения не загружаются

**Решение:**
- Проверьте что URLs изображений доступны
- Увеличьте `max_execution_time` в php.ini
- Используйте плагин для массовой загрузки изображений

### Проблема: Кириллица отображается некорректно

**Решение:**
- Убедитесь что база данных использует UTF-8
- В wp-config.php:
  ```php
  define('DB_CHARSET', 'utf8mb4');
  define('DB_COLLATE', 'utf8mb4_unicode_ci');
  ```

### Проблема: Дублируются записи при повторном импорте

**Решение:**
- В WP All Import используйте "Unique Identifier"
- Выберите уникальное поле (например, email или название)
- Установите "Update existing posts"

## Дополнительные рекомендации

### 1. Backup перед импортом

```bash
# Backup базы данных
wp db export backup_before_import.sql

# Или через phpMyAdmin
# Экспортируйте всю базу
```

### 2. Тестируйте на копии сайта

Не импортируйте сразу на продакшн. Создайте staging копию.

### 3. Импортируйте порциями

Если данных много (>1000 записей), импортируйте по частям:
- Сначала 100 компаний для теста
- Потом остальные

### 4. Проверьте SEO

После импорта обновите:
- Permalinks (Settings → Permalinks → Save Changes)
- XML Sitemap (если используете Yoast SEO или RankMath)
- Robots.txt

## Резюме: Файлы для загрузки

После запуска `python export_to_wordpress.py` у вас будут файлы:

| Файл | Куда загружать | Инструмент |
|------|----------------|------------|
| `companies_for_wordpress.csv` | WordPress Admin | WP All Import |
| `blog_posts_for_wordpress.csv` | WordPress Admin | WP All Import |
| `hal_wordpress_export.xml` | Tools → Import | WordPress Importer |
| `companies.json` | Custom скрипт | REST API |
| `blog_posts.json` | Custom скрипт | REST API |

**Рекомендуемый путь:**
1. Установите WP All Import
2. Импортируйте `companies_for_wordpress.csv`
3. Импортируйте `blog_posts_for_wordpress.csv`
4. Проверьте результат
5. Настройте мультиязычность
