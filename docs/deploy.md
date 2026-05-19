# Procedimiento de Deploy VERSO

## Frontend (automático vía Netlify)

```
npm run build  →  git push  →  GitHub  →  Netlify auto-deploy
```

- Netlify despliega automáticamente en cada push a `main`
- El build genera `/dist/` con `app-assets/` (nombre crítico para SiteGround .htaccess)
- Verificar que `/dist/app-assets/` existe tras el build antes de hacer push

## Backend PHP (semi-automático con rsync)

Ejecutar desde la raíz del proyecto en el VPS:

```bash
./deploy-php.sh
```

El script excluye siempre `config.php` y `.htaccess` — NUNCA sobrescribir estos en producción.

### Contenido de deploy-php.sh

```bash
#!/bin/bash
SITEGROUND_USER="[USUARIO_SITEGROUND]"
SITEGROUND_HOST="[HOST_SITEGROUND]"
SITEGROUND_PATH="/home/[USUARIO]/public_html/api/"
LOCAL_PATH="./api/"

rsync -avz \
  --exclude 'config.php' \
  --exclude '.htaccess' \
  --exclude '*.log' \
  --exclude 'repair-*.php' \
  -e "ssh -p [PUERTO_SSH_SITEGROUND]" \
  "$LOCAL_PATH" \
  "$SITEGROUND_USER@$SITEGROUND_HOST:$SITEGROUND_PATH"

echo "✅ Deploy PHP completado"
```

## NUNCA

- Editar `config.php` o `.htaccess` directamente en SiteGround
- Subir ficheros `repair-*.php` a producción
- Hacer deploy sin backup previo si los cambios afectan `vacation_balances` o `absence_breakdown`
- Push a `main` con código que no haya pasado `npx tsc --noEmit` limpio
