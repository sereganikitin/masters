# ЖК МАСТЕРС — Сенсорный киоск

Архитектурный макет ЖК Мастерс для сенсорной панели 1920×1080. SPA на Vite + React +
TypeScript + Tailwind, данные по квартирам — из официального XML-фида Capital Group.

## Стек

- Vite 6 + React 18 + TypeScript (strict)
- Tailwind CSS
- React Router (SPA-навигация)
- `fast-xml-parser` для парсинга XML-фида на этапе билда
- Свои motion-обёртки: `<Pressable>` (тач-фидбек + ripple), `<Reveal>` (появление при
  скролле), `useParallax` (фоновый параллакс)

## Структура

```
src/
  App.tsx                 — роутер (BrowserRouter + 7 routes)
  layouts/Stage.tsx       — обёртка-сцена 1920×1080 со scale-to-viewport и idle-возвратом
  screens/
    HeroScreen.tsx        — 4 карточки (3 колонки, правая разделена на 2)
    AboutScreen.tsx       — О проекте: длинная страница со скроллом + параллакс
    CatalogScreen.tsx     — каталог 158 квартир с фильтрами (sidebar)
    GenplanScreen.tsx     — генплан с маркерами секций
    SectionScreen.tsx     — выбор этажа в секции
    FloorScreen.tsx       — квартиры на этаже
    ApartmentScreen.tsx   — деталка квартиры
    TourScreen.tsx        — iframe 3D-тура svl.virtualland.ru
  components/
    Pressable.tsx         — кнопка с press-scale и ripple от точки касания
    Reveal.tsx            — обёртка появления (IntersectionObserver + CSS)
    Icon.tsx              — inline SVG-иконки
    TopBar.tsx            — навигационная плашка (используется только в About)
    OverlayChrome.tsx     — кнопки «×» и «Назад» поверх экранов
    RoomFilter.tsx        — таб-фильтр по типу комнат
  lib/
    useStageScale.ts      — масштабирование 1920×1080 под viewport
    useIdleReturn.ts      — автовозврат на Hero после N сек бездействия
    useReveal.ts          — IntersectionObserver-хук
    useParallax.ts        — translateY по скроллу
  data/
    types.ts              — типы Complex/House/Section/Apartment
    complex.ts            — геттеры + format-функции (formatPrice, formatArea, roomTypeLabel)
    apartments.json       — собирается на билде из XML-фида (в .gitignore)
scripts/
  build-data.ts           — скачивает XML-фид и собирает src/data/apartments.json
public/images/            — фоны для экранов (PNG из Figma)
design-refs/              — референсные PNG из Figma (для разработки, в bundle не идут)
```

## Локальная разработка

```bash
npm install
npm run data:build   # подтянет XML-фид и соберёт src/data/apartments.json
npm run dev          # vite dev на http://localhost:5173
npm run server       # параллельно — Express API для админки на :3001
```

`npm run dev` использует HMR. `/api/*` проксируется в `localhost:3001`, поэтому при
разработке админки можно держать оба процесса параллельно.

Токен админки в dev задаётся через env-переменную `ADMIN_TOKEN`. По умолчанию
(если переменную не задать) — `dev-token-change-me`.

Bash / macOS / Linux:

```bash
ADMIN_TOKEN=my-secret npm run server
```

Windows PowerShell — синтаксис другой:

```powershell
$env:ADMIN_TOKEN="my-secret"; npm run server
```

Windows cmd.exe:

```cmd
set ADMIN_TOKEN=my-secret && npm run server
```

При первом заходе на `/admin` тот же токен вводится в форму и сохраняется в
`localStorage` браузера.

Принудительно перезагрузить фид (даже если есть кэш):

```bash
FORCE_REFETCH=1 npm run data:build
```

## Production build

```bash
npm run build        # data:build → tsc → vite build
```

На выходе папка `dist/` — это статика для деплоя. Содержит:
- `index.html` (~0.8 KB)
- `assets/*.js` (~73 KB gzipped)
- `assets/*.css` (~5 KB gzipped)
- `images/*` (~49 MB — большие PNG-ассеты)

Превью production-сборки локально:

```bash
npm run preview
```

## Деплой на Таймвеб (быстрый старт)

Сервер: `seldegram@72.56.12.105`. Поддомен: `masters.infoseledka.ru`.

### Шаг 0 — DNS

В панели управления `infoseledka.ru` добавить A-запись:
```
masters  →  72.56.12.105
```

### Шаг 1 — bootstrap на сервере (один раз)

```bash
ssh seldegram@72.56.12.105
sudo bash -c 'curl -fsSL https://raw.githubusercontent.com/sereganikitin/masters/main/scripts/server-bootstrap.sh -o /tmp/bs.sh && bash /tmp/bs.sh'
```

Скрипт:
- ставит git/nginx/sqlite (если ещё нет)
- клонирует репо в `/var/www/masters`
- ставит npm-зависимости и собирает
- спрашивает `ADMIN_TOKEN` (или сгенерируй командой `openssl rand -hex 24`)
- ставит systemd-unit `masters-api` (порт **3010**, не 3001 — тот занят другим проектом)
- ставит nginx-сайт `masters.infoseledka.ru` и перезагружает nginx
- даёт `seldegram`'у NOPASSWD на `systemctl restart masters-api` и `systemctl reload nginx` (нужно для CI)

После скрипта сайт уже отдаётся на `http://masters.infoseledka.ru/`.

### Шаг 2 — HTTPS (после того как DNS прорастёт)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d masters.infoseledka.ru
```

Certbot сам обновит nginx-конфиг (добавит 443 server-block) и поставит автообновление.

### Шаг 3 — авто-деплой через GitHub Actions

В репо GitHub Settings → Secrets and variables → Actions → New repository secret. Добавить:
- `SSH_HOST` = `72.56.12.105`
- `SSH_USER` = `seldegram`
- `SSH_KEY` = приватный SSH-ключ (PEM-формат, который ходит на сервер)
- (опционально) `SSH_PORT` = `22`
- (опционально) `DEPLOY_PATH` = `/var/www/masters`

После этого любой push в `main` запускает `.github/workflows/deploy.yml`, который SSH-ится в сервер, делает `git pull && npm ci && npm run build && systemctl restart masters-api`.

Сгенерировать deploy-ключ для CI (рекомендуется — отдельный ключ для GitHub Actions):

```bash
# на сервере (или локально)
ssh-keygen -t ed25519 -f ~/.ssh/masters_deploy -C "github-actions-masters"
# публичный ключ — на сервер в authorized_keys пользователя seldegram
cat ~/.ssh/masters_deploy.pub >> ~/.ssh/authorized_keys     # если делаешь это на сервере
# приватный ключ — содержимое файла ~/.ssh/masters_deploy положить в GitHub Secret SSH_KEY
```

### Ручной деплой (если без CI)

```bash
ssh seldegram@72.56.12.105 'cd /var/www/masters && git pull && npm ci && npm run build && sudo systemctl restart masters-api'
```

---

## Детальный деплой на Таймвеб (legacy reference)

### Шаг 1 — собрать локально

```bash
npm run build
```

Папка `dist/` готова к заливке.

### Шаг 2 — залить на сервер по SSH/SFTP

Сервер: `72.56.12.105`. Положить рядом с другими проектами, например в
`/var/www/masters/` (путь уточнить на стороне Таймвеба).

```bash
# вариант через rsync (предпочтительный — синхронизация без перезаливки одинаковых файлов)
rsync -avz --delete dist/ user@72.56.12.105:/var/www/masters/

# или через scp
scp -r dist/* user@72.56.12.105:/var/www/masters/
```

### Шаг 3 — настроить nginx для SPA

Чтобы React Router работал по прямой ссылке (`/genplan`, `/floor/2/14` и т.д.), nginx
должен возвращать `index.html` для любого 404. Минимальный server-блок:

```nginx
server {
    listen 80;
    server_name kiosk.example.com;       # или IP / поддомен Таймвеба
    root /var/www/masters;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Длинный кэш для версионированных ассетов Vite (имя файла содержит хэш)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Картинки не версионированы — кэшируем короче, чтобы можно было обновить
    location /images/ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

После заливки и правки конфига:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Шаг 4 — поднять backend на сервере

Бэкенд (Express + SQLite) держит обводки секций/этажей/квартир из админки. Это
лёгкий процесс на Node.

На сервере:

```bash
# один раз
sudo apt install -y nodejs npm sqlite3
cd /var/www/masters
npm ci --omit=dev          # ставит только prod-зависимости

# постоянный запуск через systemd
sudo tee /etc/systemd/system/masters-api.service > /dev/null <<'EOF'
[Unit]
Description=Masters Kiosk Admin API
After=network.target

[Service]
WorkingDirectory=/var/www/masters
Environment=PORT=3001
Environment=ADMIN_TOKEN=замени-на-сильный-секрет
ExecStart=/usr/bin/npx tsx server/index.ts
Restart=always
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now masters-api
sudo systemctl status masters-api
```

Расширить nginx-конфиг для проксирования `/api/*` на 3001:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

База лежит в `/var/www/masters/data/admin.db`. Регулярный бэкап:

```bash
sudo crontab -e
# в редакторе:
0 3 * * * sqlite3 /var/www/masters/data/admin.db ".backup '/var/backups/masters-admin-$(date +\%F).db'"
```

### Шаг 5 — запустить киоск-режим

На сенсорной панели должен быть запущен браузер в полноэкранном режиме на адресе
сайта. Для Chromium:

```bash
chromium --kiosk --noerrdialogs --disable-translate --no-first-run \
  --disable-infobars --disable-pinch --overscroll-history-navigation=0 \
  http://kiosk.example.com/
```

## Обновление данных по квартирам

XML-фид — источник правды, обновляется на стороне Capital Group:
`https://pics.capitalgroup.ru/pic/Бой/РК_Сайт_Викторенко.xml`

Чтобы пересобрать каталог с новыми данными:

```bash
FORCE_REFETCH=1 npm run build
rsync -avz --delete dist/ user@72.56.12.105:/var/www/masters/
```

Удобно вынести в cron на сервере (если поднять Node на нём) или собирать локально и
заливать по расписанию.

## Что осталось доделать

- **SVG-контуры секций** — в XML-фиде есть только контур всего дома (одно поле
  `mcdsoft_contour_object`). Для динамической подсветки секции при наведении на
  генплан нужны отдельные контуры от дизайнера/застройщика.
- **Планы квартир** — в фиде их нет. Сейчас в карточках и деталке стоит плейсхолдер
  «План №NN». Когда появится CDN с PNG/SVG планов — заменить.
- **Финальные тексты** «О проекте» — сейчас взяты из макета, нужно подтвердить с
  заказчиком.
- **Оптимизация изображений** — PNG в `public/images/` весят 49 MB суммарно. Стоит
  прогнать через `cwebp` или sharp в WebP/AVIF и уменьшить разрешение до 1920×1080.
