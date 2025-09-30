# Маршруты Прогулки — базовая инфраструктура

Проект «Маршруты Прогулки» — платформа для планирования прогулочных маршрутов, обмена треками и общения с сообществом. Настоящая версия реализует базовую инфраструктуру из первого эпика: клиентское приложение на Next.js, стилизацию на Tailwind/shadcn, Prisma + PostgreSQL, аутентификацию через NextAuth и окружение Docker.

## Технологический стек

- **Next.js 15 (App Router) + TypeScript**
- **Tailwind CSS 3** с кастомными дизайн-токенами и компонентами shadcn/ui
- **Prisma ORM** и **PostgreSQL 16**
- **NextAuth.js** с провайдерами Credentials (email/пароль) и Google OAuth
- **React Query** и **React Hook Form** для клиентских форм и запросов
- **Docker/Docker Compose** для локальной разработки и сборки образов

## Структура аутентификации и ролей

- Пользователь регистрируется через REST-эндпоинт `/api/auth/register`, получает письмо/ссылку для подтверждения email и базовую роль `user`.
- Подтверждение email обрабатывается эндпоинтом `/api/auth/verify` с хэшированными токенами.
- Поддержаны авторизация через Google OAuth и вход по email/паролю (только после подтверждения почты).
- Ролевая модель хранится в таблицах `Role` и `UserRole` (пользователь, автор, админ). Базовая роль назначается автоматически.

## Быстрый старт (локально)

1. Установите Node.js 20+ и PostgreSQL 16 (или используйте Docker, см. ниже).
2. Скопируйте пример переменных окружения и заполните его:
   ```bash
   cp .env.example .env
   ```
3. Установите зависимости и выполните миграцию БД:
   ```bash
   npm install
   npm run prisma:generate
   npx prisma migrate deploy
   ```
4. Запустите дев-сервер:
   ```bash
   npm run dev
   ```
5. Приложение будет доступно на [http://localhost:3000](http://localhost:3000).

## Запуск в Docker Compose

Локальный стек включает сервисы `web` (Next.js) и `postgres`.

```bash
docker compose up --build
```

Команда выполнит установку зависимостей, поднимет PostgreSQL и запустит `npm run dev`. Настройки подключения к БД берутся из `docker-compose.yml`; при необходимости переопределите переменные окружения.

Для production-сборки используйте многостадийный `Dockerfile`:

```bash
docker build -t progulkas-app .
docker run --env-file .env -p 3000:3000 progulkas-app
```

Перед запуском убедитесь, что миграции применены:

```bash
npx prisma migrate deploy
```

## Скрипты npm

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Запуск дев-сервера Next.js |
| `npm run build` | Production-сборка проекта |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | Проверка кода ESLint + Prettier |
| `npm run format` | Автоформатирование Prettier |
| `npm run typecheck` | Строгая проверка типов TypeScript |
| `npm run prisma:generate` | Генерация Prisma Client |
| `npm run prisma:migrate` | Создание новой миграции (create-only) |

## Prisma и база данных

- Схема расположена в `prisma/schema.prisma`.
- Первая миграция (`0001_init`) создаёт таблицы аутентификации NextAuth и роли (`user`, `author`, `admin`).
- Для разработки можно использовать Docker PostgreSQL или локальную установку. Значение переменной `DATABASE_URL` должно указывать на PostgreSQL с `schema=public`.

## Аутентификация и подтверждение email

1. POST `/api/auth/register` создаёт пользователя, хэширует пароль (bcrypt), присваивает роль `user` и отправляет ссылку для подтверждения (в dev-режиме ссылка выводится в консоль).
2. GET `/api/auth/verify` проверяет токен, активирует пользователя и перенаправляет на `/auth/sign-in` со статусом.
3. NextAuth расположен в `src/app/api/auth/[...nextauth]/route.ts`, настройки — `src/lib/auth/options.ts`.
4. UI-страницы входа/регистрации размещены в `src/app/auth/...` и используют компоненты shadcn/ui.

## Тестирование и качество

Перед коммитом рекомендуется запускать:

```bash
npm run lint
npm run typecheck
```

TypeScript и ESLint настроены на строгий режим, Prettier подключён через плагин `prettier-plugin-tailwindcss`.

## Политика репозитория

- В репозитории запрещено хранить бинарные медиа-файлы (ico, jpg, png и т.д.).
- Для иллюстраций и иконок используйте векторные форматы в отдельных дизайн-источниках или подключайте их из CDN.
- При необходимости добавить ассеты создайте задачу на подготовку автоматической генерации изображений в рамках будущих эпиков.

## Юридические документы и аналитика

- Публичные документы размещены на страницах `/legal/privacy` и `/legal/terms`, краткий обзор доступен по адресу `/legal`.
- Cookie-баннер запрашивает согласие на использование аналитики и сохраняет выбор в `localStorage` (ключ `progulkas:cookie-consent`).
- Поддерживаются Google Analytics (Measurement ID) и Яндекс.Метрика. Для их активации задайте переменные `NEXT_PUBLIC_GA_MEASUREMENT_ID` и `NEXT_PUBLIC_YM_COUNTER_ID` в `.env`.
- Без явного согласия посетителя аналитические скрипты не загружаются.

## Полезные ссылки

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma ORM](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

