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
- **HTTPS** — автоматический SSL через Let's Encrypt

## Технологии

| Слой | Технология |
|------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Frontend | React 18, TypeScript, Tailwind CSS, Leaflet.js |
| База данных | PostgreSQL 15 |
| Web Server | Nginx (SSL, gzip, proxy) |
| SSL | Let's Encrypt (certbot) |
| Контейнеризация | Docker, Docker Compose |

---

## Развёртывание на сервере (одна команда)

Для чистого **Ubuntu 24** сервера. Docker, SSL, база данных — всё установится автоматически.

### Предварительно

1. Домен (например `historylayers.ru`) должен быть направлен на IP сервера (A-запись в DNS)
2. SSH-доступ к серверу с root-правами

### Шаги

```bash
# 1. Подключитесь к серверу
ssh root@your-server-ip

# 2. Скачайте проект
apt-get update && apt-get install -y git
git clone https://github.com/n8node/historical-timeline-map.git
cd historical-timeline-map

# 3. Запустите развёртывание (одна команда!)
sudo bash deploy.sh historylayers.ru
```

Скрипт `deploy.sh` автоматически:
- Обновит систему и установит Docker + Docker Compose
- Настроит файрвол (порты 22, 80, 443)
- Сгенерирует `.env` с безопасными случайными паролями
- Получит SSL-сертификат Let's Encrypt
- Соберёт и запустит все контейнеры
- Настроит автопродление сертификата (cron)

После завершения скрипт выведет URL и учётные данные администратора.

---

## Локальная разработка

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/n8node/historical-timeline-map.git
cd historical-timeline-map
```

### 2. Настройте окружение

```bash
cp .env.example .env
# Для локальной разработки используйте конфиг без SSL:
cp nginx/nginx.dev.conf nginx/nginx.conf
```

### 3. Запустите

```bash
docker compose up -d --build
```

### 4. Откройте в браузере

- **Карта**: http://localhost
- **Админ-панель**: http://localhost/admin

Логин: `admin@historylayers.ru` / `admin123`

---

## Структура проекта

```
historical-timeline-map/
├── deploy.sh              # Скрипт автоматического развёртывания
├── docker-compose.yml     # Оркестрация контейнеров
├── .env.example           # Шаблон переменных окружения
├── backend/               # FastAPI приложение
│   ├── app/
│   │   ├── api/           # Endpoints (public, admin, auth, upload)
│   │   ├── models/        # SQLAlchemy модели
│   │   ├── schemas/       # Pydantic схемы
│   │   ├── services/      # Auth, бизнес-логика
│   │   └── config/        # Настройки
│   ├── uploads/           # Загруженные файлы
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/              # React приложение
│   ├── src/
│   │   ├── components/    # Map, Timeline, PersonCard, Admin
│   │   ├── pages/         # HomePage, AdminPage
│   │   ├── services/      # API клиент (axios)
│   │   ├── context/       # AuthContext
│   │   └── types/         # TypeScript типы
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── nginx.conf         # Production конфиг (SSL)
│   └── nginx.dev.conf     # Локальный конфиг (без SSL)
├── init-db/
│   └── init.sql           # Схема БД + тестовые данные
└── certbot/               # SSL-сертификаты (создаётся при деплое)
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
# Логи всех сервисов
docker compose logs -f

# Логи бэкенда
docker compose logs -f backend

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Пересборка
docker compose up -d --build

# Сброс базы данных
docker compose down -v
docker compose up -d --build

# Продление SSL вручную
docker compose run --rm certbot renew
docker compose exec frontend nginx -s reload
```

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `DB_USER` | Пользователь PostgreSQL | historical_user |
| `DB_PASSWORD` | Пароль PostgreSQL | (генерируется deploy.sh) |
| `SECRET_KEY` | Секретный ключ JWT | (генерируется deploy.sh) |
| `ADMIN_EMAIL` | Email администратора | admin@historylayers.ru |
| `ADMIN_PASSWORD` | Пароль администратора | (генерируется deploy.sh) |
| `DOMAIN` | Доменное имя | historylayers.ru |
| `CERT_EMAIL` | Email для Let's Encrypt | admin@historylayers.ru |

## Лицензия

MIT
