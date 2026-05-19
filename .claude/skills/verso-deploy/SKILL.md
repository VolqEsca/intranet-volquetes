---
name: verso-deploy
description: "Procedimiento de deploy VERSO. Activar cuando se pida desplegar cambios a producción."
---

## Frontend

npm run build → git push → Netlify auto-despliega.
Verificar que /dist/app-assets/ existe tras el build.
No hacer push con `npx tsc --noEmit` sucio.

## Backend PHP

Ejecutar ./deploy-php.sh desde raíz del proyecto.
El script excluye config.php y .htaccess — NUNCA subir estos ficheros.
Verificar endpoint en producción tras deploy.

## NUNCA

- Editar config.php o .htaccess directamente en SiteGround
- Subir ficheros repair-*.php a producción
- Hacer deploy sin backup previo si los cambios afectan vacation_balances o absence_breakdown
