#!/usr/bin/env bash
set -euo pipefail

# ══════════════════════════════════════════════════════════════
#  Historical Timeline Map — Автоматическое развёртывание
#
#  Использование:
#    sudo bash deploy.sh                  # домен historylayers.ru
#    sudo bash deploy.sh mydomain.com     # свой домен
#
#  Требования: чистый Ubuntu 24, root-доступ, домен направлен
#  на IP сервера (A-запись в DNS).
# ══════════════════════════════════════════════════════════════

DOMAIN="${1:-historylayers.ru}"
EMAIL="admin@${DOMAIN}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
info() { echo -e "  ${BLUE}→${NC} $1"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

echo ""
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${BLUE}   Historical Timeline Map — Deploy              ${NC}"
echo -e "${BOLD}${BLUE}══════════════════════════════════════════════════${NC}"
echo ""
info "Домен:     ${BOLD}${DOMAIN}${NC}"
info "Директория: ${SCRIPT_DIR}"
echo ""

# ── Проверки ──
[ "$EUID" -ne 0 ] && fail "Запустите от root: sudo bash deploy.sh"

if [ ! -f "${SCRIPT_DIR}/docker-compose.yml" ]; then
    fail "docker-compose.yml не найден. Запустите скрипт из корня проекта."
fi

# ══════════════════════════════════════════════════════════════
# 1. ОБНОВЛЕНИЕ СИСТЕМЫ
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[1/7] Обновление системы${NC}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl git openssl ca-certificates gnupg \
    lsb-release ufw apt-transport-https

log "Системные пакеты обновлены"

# ══════════════════════════════════════════════════════════════
# 2. УСТАНОВКА DOCKER
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[2/7] Docker${NC}"

if command -v docker &>/dev/null; then
    warn "Docker уже установлен: $(docker --version)"
else
    info "Установка Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log "Docker установлен: $(docker --version)"
fi

if docker compose version &>/dev/null; then
    log "Docker Compose: $(docker compose version --short)"
else
    apt-get install -y -qq docker-compose-plugin
    log "Docker Compose plugin установлен"
fi

# ══════════════════════════════════════════════════════════════
# 3. FIREWALL
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[3/7] Настройка файрвола${NC}"

ufw allow 22/tcp   >/dev/null 2>&1
ufw allow 80/tcp   >/dev/null 2>&1
ufw allow 443/tcp  >/dev/null 2>&1
ufw allow 8080/tcp >/dev/null 2>&1
ufw --force enable >/dev/null 2>&1

log "Открыты порты: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (Adminer)"

# ══════════════════════════════════════════════════════════════
# 4. ГЕНЕРАЦИЯ .env
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[4/7] Конфигурация окружения${NC}"

ADMIN_PASS=""

if [ ! -f "${SCRIPT_DIR}/.env" ]; then
    DB_PASS=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)
    ADMIN_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

    cat > "${SCRIPT_DIR}/.env" << ENVEOF
DB_USER=historical_user
DB_PASSWORD=${DB_PASS}
SECRET_KEY=${SECRET}
ENVIRONMENT=production
ADMIN_EMAIL=admin@${DOMAIN}
ADMIN_PASSWORD=${ADMIN_PASS}
DOMAIN=${DOMAIN}
CERT_EMAIL=${EMAIL}
ENVEOF

    log ".env создан с безопасными случайными паролями"
    echo ""
    echo -e "  ${YELLOW}╔══════════════════════════════════════════╗${NC}"
    echo -e "  ${YELLOW}║  СОХРАНИТЕ ПАРОЛЬ АДМИНИСТРАТОРА:        ║${NC}"
    echo -e "  ${YELLOW}║  Email:    admin@${DOMAIN}$(printf '%*s' $((23 - ${#DOMAIN})) '')║${NC}"
    echo -e "  ${YELLOW}║  Пароль:  ${ADMIN_PASS}$(printf '%*s' $((29 - ${#ADMIN_PASS})) '')║${NC}"
    echo -e "  ${YELLOW}╚══════════════════════════════════════════╝${NC}"
    echo ""
else
    warn ".env уже существует, используем текущий"
fi

# ══════════════════════════════════════════════════════════════
# 5. ПОДГОТОВКА ДИРЕКТОРИЙ И NGINX
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[5/7] Подготовка конфигурации${NC}"

mkdir -p "${SCRIPT_DIR}/certbot/conf"
mkdir -p "${SCRIPT_DIR}/certbot/www"
mkdir -p "${SCRIPT_DIR}/backend/uploads/seed"

# Генерация production nginx.conf с SSL и доменом
cat > "${SCRIPT_DIR}/nginx/nginx.conf" << 'NGINXEOF'
# HTTP → HTTPS redirect + certbot challenge
server {
    listen 80;
    server_name __DOMAIN__ www.__DOMAIN__;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name __DOMAIN__ www.__DOMAIN__;

    # SSL certificates (Let's Encrypt)
    ssl_certificate     /etc/letsencrypt/live/__DOMAIN__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__DOMAIN__/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    root /usr/share/nginx/html;
    index index.html;
    client_max_body_size 10m;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # API → backend
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Uploaded files → backend
    location /uploads/ {
        proxy_pass http://backend:8000/uploads/;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

# Подстановка домена
sed -i "s/__DOMAIN__/${DOMAIN}/g" "${SCRIPT_DIR}/nginx/nginx.conf"

log "nginx.conf сгенерирован для ${DOMAIN} (HTTPS + HTTP redirect)"

# ══════════════════════════════════════════════════════════════
# 6. SSL-СЕРТИФИКАТ (Let's Encrypt)
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[6/7] SSL-сертификат (Let's Encrypt)${NC}"

CERT_PATH="${SCRIPT_DIR}/certbot/conf/live/${DOMAIN}"

if [ -d "${CERT_PATH}" ] && [ -f "${CERT_PATH}/fullchain.pem" ]; then
    warn "Сертификат уже существует, пропускаем"
else
    info "Получение SSL-сертификата (standalone)..."
    info "Убедитесь, что DNS A-запись ${DOMAIN} → IP этого сервера"

    # Остановить всё, что может занимать порт 80
    docker compose -f "${SCRIPT_DIR}/docker-compose.yml" down 2>/dev/null || true
    systemctl stop nginx 2>/dev/null || true
    fuser -k 80/tcp 2>/dev/null || true

    sleep 2

    docker run --rm \
        -p 80:80 \
        -v "${SCRIPT_DIR}/certbot/conf:/etc/letsencrypt" \
        -v "${SCRIPT_DIR}/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
            --standalone \
            --email "${EMAIL}" \
            --agree-tos \
            --no-eff-email \
            -d "${DOMAIN}" \
            -d "www.${DOMAIN}"

    log "SSL-сертификат получен"
fi

# ══════════════════════════════════════════════════════════════
# 7. СБОРКА И ЗАПУСК
# ══════════════════════════════════════════════════════════════
echo -e "\n${BOLD}[7/7] Сборка и запуск сервисов${NC}"

cd "${SCRIPT_DIR}"

docker compose down 2>/dev/null || true
docker compose up -d --build

info "Ожидание запуска сервисов..."

# Ждём, пока backend ответит
for i in $(seq 1 30); do
    if curl -sf -o /dev/null "http://localhost:8000/api/health" 2>/dev/null; then
        log "Backend запущен"
        break
    fi
    if [ "$i" -eq 30 ]; then
        warn "Backend ещё запускается, проверьте логи: docker compose logs backend"
    fi
    sleep 2
done

# Проверяем HTTPS
sleep 3
if curl -sf -o /dev/null "https://${DOMAIN}/api/health" 2>/dev/null; then
    log "HTTPS работает"
else
    warn "HTTPS может быть ещё недоступен, подождите 30 секунд"
fi

# ══════════════════════════════════════════════════════════════
# АВТОПРОДЛЕНИЕ СЕРТИФИКАТА (cron)
# ══════════════════════════════════════════════════════════════
RENEW_CMD="0 3 1,15 * * cd ${SCRIPT_DIR} && docker compose run --rm certbot renew --quiet && docker compose exec -T frontend nginx -s reload >> /var/log/certbot-renew.log 2>&1"
(crontab -l 2>/dev/null | grep -v "certbot renew" || true; echo "${RENEW_CMD}") | crontab -

log "Автопродление сертификата: 1-го и 15-го числа каждого месяца"

# ══════════════════════════════════════════════════════════════
# ГОТОВО
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}   Развёртывание завершено!                       ${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Сайт:     ${BOLD}https://${DOMAIN}${NC}"
echo -e "  Админка:  ${BOLD}https://${DOMAIN}/admin${NC}"
echo ""
if [ -n "${ADMIN_PASS}" ]; then
    echo -e "  ${YELLOW}Логин:  admin@${DOMAIN}${NC}"
    echo -e "  ${YELLOW}Пароль: ${ADMIN_PASS}${NC}"
    echo ""
fi
echo -e "  ${RED}${BOLD}Обязательно сохраните пароль и смените его при первом входе!${NC}"
echo ""
echo "  Полезные команды:"
echo "    docker compose logs -f          # Логи всех сервисов"
echo "    docker compose logs backend     # Логи бэкенда"
echo "    docker compose restart          # Перезапуск"
echo "    docker compose down             # Остановка"
echo "    docker compose up -d --build    # Пересборка"
echo ""
