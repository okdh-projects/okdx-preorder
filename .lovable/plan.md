
## Что переделываем

Проект сейчас — TanStack Start (SSR, файловый роутинг). Для GitHub Pages это не подходит: нужен чистый статический SPA с HashRouter. Ниже — полный план работ.

## 1. Миграция стека: TanStack Start → Vite SPA + HashRouter

- Удаляем TanStack Start / TanStack Router и всё связанное с SSR: `src/routes/`, `src/routeTree.gen.ts`, `src/router.tsx`, `src/server.ts`, `src/start.ts`, шелл в `__root.tsx`, плагин `@tanstack/*` в `vite.config.ts`.
- Ставим `react-router-dom`, добавляем `index.html`, `src/main.tsx`, `src/App.tsx` с `HashRouter`.
- `vite.config.ts`: `base: './'` — относительные пути для GitHub Pages.
- Все `<Link to>` из TanStack переводим на `react-router-dom`.
- Роуты: `#/` (витрина), `#/cart`, `#/product/:id`, `#/admin`, `#/admin/login`.
- Добавляем workflow `.github/workflows/deploy.yml` для деплоя на GH Pages (по желанию — могу оставить только сборку и README-инструкцию).

## 2. Supabase (свой проект)

- Просим два секрета: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (публичные, безопасны в клиенте — GH Pages это статика).
- Создаём `src/lib/supabase.ts` с публичным клиентом.
- Схема (миграции ты применишь у себя — я дам готовый SQL-файл `supabase/schema.sql`):

```text
products(id uuid pk, category text, name text, price numeric,
         sale_price numeric null, sizes text[], variant_label text null,
         variants text[], images text[], description text, created_at)
orders(id uuid pk, created_at timestamptz default now(),
       client_name text, client_contact text, delivery_address text,
       items jsonb, total_price numeric, status text default 'Новый')
promo_codes(id uuid pk, code text unique, is_active bool default true)
app_settings(key text pk, value jsonb)   -- флаг "предзаказ закрыт"
```

- RLS: `products` и `app_settings` — публичное чтение (`TO anon`). `orders` — INSERT для `anon` (создание предзаказа), SELECT/UPDATE только для `authenticated`. `promo_codes` — SELECT `anon` где `is_active`, полное управление для `authenticated`.
- Поля «остаток на складе» и «цвет» полностью убираем из схемы, seed-данных, UI и корзины.

## 3. Авторизация и защита админки

- `#/admin` показывает форму логина (`supabase.auth.signInWithPassword`).
- Регистрация закрыта — аккаунты создаются вручную в Supabase Dashboard.
- Компонент `RequireAuth` слушает `onAuthStateChange`; пока сессии нет — рендерится только логин, никакого UI админки.
- Кнопка «Выйти» в шапке админки.

## 4. Публичная часть

- Навбар на витрине: только логотип + иконка корзины. Никаких «Каталог/Панель».
- На `#/cart` и `#/product/:id` в шапке — единственная ссылка «← Назад в каталог».
- Оформление заказа: форма (Имя, Telegram `@username`, Телефон, Адрес доставки) → `INSERT` в `orders` → toast «Заказ принят, №…» → чистим корзину → редирект на витрину.
- Если `app_settings.preorder_closed = true` — вместо витрины экран «К сожалению, предзаказ мерча закончился» + кнопка на `https://www.instagram.com/okdh.bsu/`.

## 5. Админка `#/admin` (после логина)

Табы: **Заказы**, **Товары**, **Промокоды**, **Аналитика**, **Настройки**, **Логи**.

- **Заказы**: таблица заказов, сортировка по `client_name` A→Я, смена статуса `Новый → Оплачен → Отправлен` селектом, кнопка «Выгрузить в Excel». Realtime через `supabase.channel('orders').on('postgres_changes', ...)`.
- **Товары**: CRUD, категория — Dropdown из уникальных значений БД + пункт «+ Добавить свою» (инлайн-инпут). Поле `sale_price`. Иконка «глаз» открывает модалку с копией `ProductCard` из витрины.
- **Промокоды**: список, создание, тумблер `is_active`.
- **Аналитика**:
  - Товарная: по каждому товару таблица размеров → суммарные штуки по всем заказам (агрегация в браузере из `orders.items`).
  - Финансовая: общая выручка, выручка по заказам с промо/`sale_price`, средний чек.
- **Настройки**: чекбокс «Закрыть предзаказ» → `upsert` в `app_settings`.
- **Логи**: чтение из `localStorage` (ключ `okdx-admin-log`). Каждое действие админа (смена статуса, добавление товара, создание промокода, тумблер настроек) вызывает `logAction({ ts, actor: email, action, payload })`.

## 6. Экспорт Excel

Чистый JS без зависимостей: собираем CSV со всеми полями + плоский список позиций, `new Blob([csv], { type: 'text/csv;charset=utf-8' })`, скачиваем через `<a download="orders.csv">`. BOM `\uFEFF` в начале — чтобы Excel корректно открыл кириллицу.

## Технические детали

- Ключ `VITE_SUPABASE_PUBLISHABLE_KEY` попадёт в бандл — это норма для publishable-ключа Supabase; безопасность держится на RLS.
- Realtime: одна подписка на `orders` в компоненте админки, ре-фетч при `INSERT/UPDATE/DELETE`.
- Zustand `store.ts` оставляем **только** для корзины (localStorage). Все `products/orders` — из Supabase (react-query или локальные `useEffect`+`useState`; выберу react-query, он уже стоит).
- Seed-данные в `store.ts` больше не нужны — удаляем, но кладу их в `supabase/seed.sql`, чтобы ты одной кнопкой залил их в свой проект.

## Порядок действий

1. Спрошу через `add_secret` `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Снесу TanStack, поставлю `react-router-dom` и `@supabase/supabase-js`.
3. Соберу новый шелл (`index.html`, `main.tsx`, `App.tsx` с HashRouter), базовые страницы витрины/корзины/товара на новом роутере.
4. Сделаю `supabase/schema.sql` + `supabase/seed.sql` (применяешь у себя).
5. Реализую админку (логин, табы, realtime, экспорт, логи, предпросмотр).
6. Проверю сборку и то, что `dist/` открывается из `file://` (гарантия для GH Pages).

## Что мне нужно от тебя перед стартом

- Ты создашь в Supabase Dashboard одного пользователя (Auth → Users → Add user, email+password) — им будешь логиниться в `#/admin`. Регистрации в UI не будет.
- После того как я дам `schema.sql` / `seed.sql`, применишь их через SQL Editor.

Подтверди план — и я начинаю с запроса секретов и миграции стека.
