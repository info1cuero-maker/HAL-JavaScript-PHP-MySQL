# HAL Backend Contracts

## Overview
Backend для платформы HAL - каталог услуг с двуязычной поддержкой (UA/RU). Данные будут мигрированы с WordPress, поэтому структура должна быть гибкой для импорта.

## Data Models

### 1. Company (Компания)
```
{
  id: string (MongoDB ObjectId),
  name: string (укр),
  nameRu: string (рус),
  description: string (укр),
  descriptionRu: string (рус),
  category: string (cafe, sport, beauty, art, home, auto, construction, other),
  location: {
    city: string,
    address: string,
    coordinates: { lat: number, lng: number } (optional)
  },
  contacts: {
    phone: string,
    email: string,
    website: string (optional)
  },
  image: string (URL),
  images: [string] (array of URLs, optional),
  rating: number (0-5),
  reviewCount: number,
  isNew: boolean,
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  userId: string (владелец компании, optional)
}
```

### 2. User (Пользователь)
```
{
  id: string (MongoDB ObjectId),
  name: string,
  email: string (unique),
  password: string (hashed),
  role: string (user, business, admin),
  phone: string (optional),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3. Review (Отзыв)
```
{
  id: string (MongoDB ObjectId),
  companyId: string,
  userId: string,
  userName: string,
  rating: number (1-5),
  comment: string,
  commentRu: string (optional),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. BlogPost (Статья блога)
```
{
  id: string (MongoDB ObjectId),
  titleUk: string,
  titleRu: string,
  contentUk: string,
  contentRu: string,
  excerptUk: string,
  excerptRu: string,
  image: string (URL),
  author: string,
  publishedAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 5. Category (Категория)
```
{
  id: string,
  nameUk: string,
  nameRu: string,
  icon: string,
  count: number (calculated)
}
```

## API Endpoints

### Companies

#### GET /api/companies
Получить список компаний с фильтрацией и пагинацией
- Query params: 
  - `page` (default: 1)
  - `limit` (default: 20)
  - `category` (optional)
  - `search` (optional, поиск по названию)
  - `sort` (recent, popular, rating)
  - `isNew` (boolean, optional)
- Response: `{ companies: [], total: number, page: number, pages: number }`

#### GET /api/companies/:id
Получить детали компании
- Response: Company object

#### POST /api/companies
Создать новую компанию (требуется аутентификация)
- Body: Company data (без id, createdAt, updatedAt)
- Response: Created company object

#### PUT /api/companies/:id
Обновить компанию (требуется аутентификация, владелец или админ)
- Body: Partial company data
- Response: Updated company object

#### DELETE /api/companies/:id
Удалить компанию (требуется аутентификация, владелец или админ)
- Response: `{ message: "Company deleted" }`

### Categories

#### GET /api/categories
Получить все категории с количеством компаний
- Response: Array of categories

### Users & Auth

#### POST /api/auth/register
Регистрация нового пользователя
- Body: `{ name, email, password, phone (optional) }`
- Response: `{ user, token }`

#### POST /api/auth/login
Вход пользователя
- Body: `{ email, password }`
- Response: `{ user, token }`

#### GET /api/auth/me
Получить текущего пользователя (требуется аутентификация)
- Response: User object

### Reviews

#### GET /api/companies/:id/reviews
Получить отзывы для компании
- Query params: `page`, `limit`
- Response: `{ reviews: [], total: number }`

#### POST /api/companies/:id/reviews
Добавить отзыв (требуется аутентификация)
- Body: `{ rating, comment, commentRu (optional) }`
- Response: Created review object

### Blog

#### GET /api/blog
Получить статьи блога
- Query params: `page`, `limit`
- Response: `{ posts: [], total: number }`

#### GET /api/blog/:id
Получить статью
- Response: BlogPost object

### Contact

#### POST /api/contact
Отправить сообщение через форму контактов
- Body: `{ name, email, message }`
- Response: `{ message: "Message sent successfully" }`

## Mock Data Replacement

### Frontend файлы для обновления:

1. **src/data/mockData.js** 
   - Удалить mockCompanies
   - Удалить blogPosts
   - Оставить categories (они статические)

2. **src/pages/Home.js**
   - Заменить mockCompanies на API call к `/api/companies?limit=8&sort=recent`
   - Добавить useEffect для загрузки данных
   - Добавить состояние loading

3. **src/pages/Search.js**
   - Заменить mockCompanies на API call к `/api/companies` с фильтрами
   - Реализовать реальный поиск и фильтрацию через API

4. **src/pages/CompanyDetail.js**
   - Заменить mockCompanies на API call к `/api/companies/:id`
   - Загружать отзывы из `/api/companies/:id/reviews`

5. **src/pages/Blog.js**
   - Заменить blogPosts на API call к `/api/blog`

6. **src/pages/AddBusiness.js**
   - Подключить к POST /api/companies
   - Добавить загрузку изображений (если нужно)

7. **src/pages/Contacts.js**
   - Подключить форму к POST /api/contact

## Authentication Flow

1. JWT токены для аутентификации
2. Токен хранится в localStorage
3. Axios interceptor для добавления токена к запросам
4. Protected routes для authenticated пользователей

## Migration from WordPress

Для переноса данных с WordPress потребуется:
1. Export данных из WordPress (posts, custom post types)
2. Migration script для преобразования в MongoDB формат
3. Маппинг полей WordPress -> HAL
4. Импорт изображений

## Environment Variables

Backend (.env):
```
MONGO_URL=mongodb://localhost:27017/hal
DB_NAME=hal
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
PORT=8001
```

Frontend (.env):
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Implementation Order

1. ✅ Mock frontend (completed)
2. 🔄 Backend models & database setup
3. 🔄 Backend API endpoints
4. 🔄 Frontend integration with API
5. 🔄 Authentication implementation
6. 🔄 Testing
7. ⏳ WordPress migration script
