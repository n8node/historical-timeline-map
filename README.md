# Historical Timeline Map

Интерактивная карта мира с временной шкалой, показывающая исторических личностей, живших в выбранный период. Проект позволяет увидеть, какие известные люди были современниками в разные эпохи.

## Возможности

- **Интерактивная карта мира** — полноэкранная карта с маркерами исторических персон (Leaflet.js)
- **Временная шкала** — слайдер от 5000 г. до н.э. до 2026 г. н.э. с маркерами эпох
- **Карточки персоналий** — фото, биография, галерея, места рождения и смерти
- **Административная панель** — CRUD для персон, загрузка фото, статистика
- **Темная тема** — стильный минималистичный дизайн с glassmorphism
- **Адаптивность** — корректное отображение на всех устройствах
- **Docker** — полная контейнеризация, запуск одной командой

## Технологии

| Слой | Технология |
|------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Frontend | React 18, TypeScript, Tailwind CSS, Leaflet.js |
| База данных | PostgreSQL 15 |
| Web Server | Nginx |
| Контейнеризация | Docker, Docker Compose |

## Быстрый старт

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/yourusername/historical-timeline-map.git
cd historical-timeline-map
```

### 2. Настройте переменные окружения

```bash
cp .env.example .env
# Отредактируйте .env и установите безопасные значения
```

### 3. Запустите проект

```bash
docker-compose up -d
```

### 4. Откройте в браузере

- **Карта**: http://localhost
- **Админ-панель**: http://localhost/admin

## Административный доступ

При первом запуске автоматически создается администратор:

- **Email**: admin@example.com
- **Password**: admin123

> ⚠️ Обязательно смените пароль после первого входа!

## Структура проекта

```
historical-timeline-map/
├── backend/           # FastAPI приложение
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── models/    # SQLAlchemy модели
│   │   ├── schemas/   # Pydantic схемы
│   │   ├── services/  # Бизнес-логика
│   │   └── config/    # Конфигурация
│   ├── uploads/       # Загруженные файлы
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/  # UI компоненты
│   │   ├── pages/       # Страницы
│   │   ├── services/    # API сервисы
│   │   ├── context/     # React контексты
│   │   └── types/       # TypeScript типы
│   ├── Dockerfile
│   └── package.json
├── nginx/             # Конфигурация Nginx
├── init-db/           # SQL для инициализации БД
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Публичное API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/persons?year=YYYY` | Персоны, жившие в указанный год |
| GET | `/api/persons/:id` | Детальная информация о персоне |
| GET | `/api/timeline/eras` | Список исторических эпох |

### Административное API (требует авторизации)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/login` | Авторизация |
| GET | `/api/admin/persons` | Список всех персон (пагинация) |
| POST | `/api/admin/persons` | Создать персону |
| PUT | `/api/admin/persons/:id` | Обновить персону |
| DELETE | `/api/admin/persons/:id` | Удалить персону |
| POST | `/api/admin/upload/image` | Загрузить изображение |
| GET | `/api/admin/stats` | Статистика |

## Управление

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f

# Пересборка после изменений
docker-compose up -d --build

# Сброс базы данных
docker-compose down -v
docker-compose up -d
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `DB_USER` | Пользователь PostgreSQL | historical_user |
| `DB_PASSWORD` | Пароль PostgreSQL | - |
| `SECRET_KEY` | Секретный ключ для JWT | - |
| `ADMIN_EMAIL` | Email администратора | admin@example.com |
| `ADMIN_PASSWORD` | Пароль администратора | admin123 |
| `FRONTEND_PORT` | Порт фронтенда | 80 |

## Лицензия

MIT
