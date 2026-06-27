# Novatek — Despliegue en VPS (reemplazar el WordPress actual)

Guía paso a paso para clonar el repo en tu VPS, correrlo con **PM2** detrás de **Nginx**,
y apuntar el dominio `novatekargentina.com.ar` (hoy en WordPress) a esta nueva app Astro.

> La app ahora corre como **servidor Node standalone** (adaptador `@astrojs/node`), no en Vercel.
> El panel de analíticas usa **SQLite** (archivo en `./data/analytics.db`), sin servicios externos.

---

## 0. Resumen de la arquitectura

```
Internet → Nginx (puerto 80/443, SSL) → PM2 → Node (Astro SSR, puerto 3500)
                                                   └─ ./data/analytics.db (SQLite)
```

- **Build:** `pnpm build` genera `dist/server/entry.mjs` (servidor) + `dist/client/` (estáticos).
- **Run:** PM2 ejecuta `dist/server/entry.mjs` escuchando en `127.0.0.1:3500`.
- **Nginx** hace de reverse proxy y termina SSL (Let's Encrypt).

---

## 1. Preparar el VPS (una sola vez)

Conectate por SSH como root (o un usuario con sudo):

```bash
ssh tu_usuario@TU_IP_VPS
```

Instalá Node 20 LTS, pnpm, git y nginx:

```bash
# Node 20 LTS (vía NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx build-essential

# pnpm y pm2 globales
sudo npm install -g pnpm@10 pm2

# Verificar
node -v   # v20.x
pnpm -v   # 10.x
```

> `build-essential` es necesario porque `better-sqlite3` compila un binario nativo.

---

## 2. Clonar el repo y construir

```bash
# Carpeta de apps
sudo mkdir -p /var/www && cd /var/www

# Cloná tu repo (ajustá la URL)
sudo git clone https://github.com/TU_USUARIO/novatek.git
sudo chown -R $USER:$USER /var/www/novatek
cd /var/www/novatek

# Instalar dependencias y construir
pnpm install --no-frozen-lockfile
pnpm build
```

Esto deja el servidor listo en `dist/server/entry.mjs`.

---

## 3. Variables de entorno

El repo incluye `.env.example` como plantilla. Copialo y completá los valores:

```bash
cp .env.example .env
nano .env
```

Contenido mínimo de `/var/www/novatek/.env` (no se commitea):

```bash
# Login del panel (/admin/login y /admin/analytics)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123          # ⚠️ cambialo por una clave fuerte en producción

# Secreto para firmar las cookies de sesión (obligatorio)
# Generalo con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=pegá_acá_un_valor_aleatorio_largo

# Catálogo (Neon Postgres) — solo si usás el admin de productos
DATABASE_URL=postgres://...

# Analytics SQLite (opcional, default ./data/analytics.db)
ANALYTICS_DB_PATH=/var/www/novatek/data/analytics.db
```

> 🔐 **Login:** el panel `/admin/analytics` queda protegido por sesión (cookie HttpOnly, 7 días).
> Sin iniciar sesión, cualquier acceso redirige a `/admin/login`. Cambiá `ADMIN_PASSWORD` y `AUTH_SECRET`
> antes de salir a producción. La cookie usa el flag `Secure` cuando `NODE_ENV=production` (requiere HTTPS,
> paso 7).

> Si **no** usás el catálogo con base Postgres, podés dejar `DATABASE_URL` vacío:
> las páginas públicas y las analíticas funcionan igual (las analíticas son 100% SQLite local).

---

## 4. Arrancar con PM2

El repo ya incluye `ecosystem.config.cjs` (puerto 3500, modo fork, autorestart):

```bash
cd /var/www/novatek
pm2 start ecosystem.config.cjs
pm2 save                       # persiste la lista de procesos
pm2 startup                    # genera el comando para arrancar PM2 al bootear
# ↑ copiá y ejecutá la línea que te imprime (sudo env PATH=... pm2 startup ...)
```

Comprobá que responde localmente:

```bash
curl -I http://127.0.0.1:3500      # debe devolver 200 OK
pm2 logs novatek                   # ver logs en vivo
pm2 status                         # estado del proceso
```

---

## 5. Nginx como reverse proxy

Creá `/etc/nginx/sites-available/novatek`:

```nginx
server {
    listen 80;
    server_name novatekargentina.com.ar www.novatekargentina.com.ar;

    # Archivos estáticos servidos directo por Nginx (más rápido)
    location /_astro/ {
        alias /var/www/novatek/dist/client/_astro/;
        expires 1y;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:3500;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }

    client_max_body_size 10M;
}
```

Activala y recargá:

```bash
sudo ln -s /etc/nginx/sites-available/novatek /etc/nginx/sites-enabled/
sudo nginx -t          # test de sintaxis
sudo systemctl reload nginx
```

> **Importante para las analíticas:** el header `X-Forwarded-For` que setea Nginx arriba es
> lo que permite contar visitantes únicos (la IP se hashea, nunca se guarda en claro).

---

## 6. Cambiar el dominio del WordPress a la nueva app

El sitio actual es WordPress. Para que `novatekargentina.com.ar` muestre esta app:

### Opción A — el dominio ya apunta a este mismo VPS
Si el WordPress vive en **este mismo servidor**, solo desactivá su sitio Nginx/Apache y
dejá activo el de Novatek:

```bash
# si era nginx
sudo rm /etc/nginx/sites-enabled/wordpress    # o el nombre que tenga
sudo systemctl reload nginx

# si era apache
sudo a2dissite wordpress.conf && sudo systemctl reload apache2
```

### Opción B — el WordPress está en otro hosting
Cambiá los registros DNS del dominio (en tu proveedor: NIC.ar, Cloudflare, etc.)
para que apunten a la IP de tu VPS:

| Tipo  | Nombre | Valor              |
|-------|--------|--------------------|
| A     | `@`    | `TU_IP_VPS`        |
| A     | `www`  | `TU_IP_VPS`        |

La propagación DNS puede tardar de minutos a 24-48 h. Verificá con:

```bash
dig +short novatekargentina.com.ar
```

> 💡 **Recomendado:** probá todo primero con un subdominio (`nuevo.novatekargentina.com.ar`)
> apuntando al VPS. Cuando confirmes que anda, recién movés el dominio principal. Así no
> tirás abajo el sitio actual mientras probás.

---

## 7. HTTPS con Let's Encrypt (gratis)

Una vez que el DNS ya apunta al VPS:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d novatekargentina.com.ar -d www.novatekargentina.com.ar
```

Certbot edita el Nginx automáticamente y agrega la renovación. Probala:

```bash
sudo certbot renew --dry-run
```

---

## 8. Actualizar el sitio (cada vez que cambies código)

```bash
cd /var/www/novatek
git pull
pnpm install --no-frozen-lockfile
pnpm build
pm2 reload novatek      # recarga sin downtime
```

Guardá esto como `deploy.sh` para hacerlo de un comando:

```bash
cat > deploy.sh <<'EOF'
#!/usr/bin/env bash
set -e
cd /var/www/novatek
git pull
pnpm install --no-frozen-lockfile
pnpm build
pm2 reload novatek
echo "✅ Deploy completo"
EOF
chmod +x deploy.sh
```

---

## 9. Backups de las analíticas

La base de datos es un solo archivo: `/var/www/novatek/data/analytics.db`.
Backup simple por cron diario:

```bash
# crontab -e
0 3 * * * cp /var/www/novatek/data/analytics.db /var/backups/analytics-$(date +\%F).db
```

> El directorio `data/` está en `.gitignore` — los datos viven solo en el VPS, no se commitean.

---

## 10. Checklist final

- [ ] `curl -I http://127.0.0.1:3500` → 200 OK
- [ ] `pm2 status` → novatek **online**
- [ ] `pm2 startup` + `pm2 save` ejecutados (sobrevive a reinicios)
- [ ] Nginx proxy activo, WordPress viejo desactivado
- [ ] DNS apuntando al VPS (`dig +short`)
- [ ] HTTPS activo (candado en el navegador)
- [ ] `/admin/login` pide credenciales y entra con tu usuario/clave
- [ ] `/admin/analytics` muestra gráficos (y redirige a login si cerrás sesión)
- [ ] Navegar el sitio y ver que la visita aparece en **Actividad reciente**

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `/admin/analytics` muestra "Error de base de datos" | `better-sqlite3` no compiló | `sudo apt-get install -y build-essential python3` y `pnpm rebuild better-sqlite3` |
| 502 Bad Gateway | la app no corre en :3500 | `pm2 logs novatek` para ver el error; `pm2 restart novatek` |
| Visitas no se registran | falta `X-Forwarded-For` | revisá el bloque `proxy_set_header` del Nginx |
| Estáticos sin cargar | ruta `_astro` mal | confirmá que `alias` apunta a `dist/client/_astro/` |
| Cambios no se ven | build viejo | `pnpm build && pm2 reload novatek` |
