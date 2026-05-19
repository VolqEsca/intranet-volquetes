# Restricciones SiteGround GrowBig — Entorno Producción

**IMPORTANTE:** SiteGround es hosting compartido. Sin acceso root.
Confirmar siempre con Miguel antes de usar cualquier extensión o librería no listada aquí.
No asumir que algo funciona en el VPS implica que funciona en producción.

## PHP

- Versión: PHP 8.2.31 (coincide con stack VERSO)
- Sin acceso a composer global ni npm en producción
- Sin control sobre php.ini global — solo las variables del panel

## Variables PHP relevantes

| Variable | Valor | Impacto |
|----------|-------|---------|
| memory_limit | 768M | Sin restricciones para PDFs y reports |
| max_execution_time | 120s | Suficiente para todos los endpoints actuales |
| upload_max_filesize | 256M | Sin restricciones para imports |
| post_max_size | 256M | Sin restricciones |
| max_input_vars | 3000 | Suficiente para formularios complejos |
| opcache.jit | disable | JIT desactivado — sin impacto actual |
| session.gc_maxlifetime | 1440 | Sesiones expiran en 24 minutos de inactividad |

## Extensiones PHP

### Activas (disponibles sin configuración)
- `opcache` — rendimiento PHP optimizado
- `memcached` — caché de sesiones disponible si se necesita

### Apagadas pero activables desde el panel
- `imagick` — manipulación de imágenes
- `redis` — caché alternativa
- `geoip` — geolocalización
- `mcrypt` — cifrado legacy (NO usar, obsoleto)
- `ioncube` — loader código cifrado
- `mailparse` — parsing de emails
- `ssh2` — conexiones SSH desde PHP

**Regla:** Si un endpoint nuevo necesita una extensión apagada →
confirmar con Miguel antes de escribir código que dependa de ella.
No activar extensiones en producción sin prueba previa en VPS.

## Lo que NO hay en SiteGround

- Sin acceso root ni sudo
- Sin Node.js ni npm (build en VPS → se sube /dist compilado)
- Sin Docker ni procesos persistentes
- Sin Redis activo por defecto (activable pero requiere configuración)

## SSH

- Acceso SSH disponible pero requiere reconfiguración de claves
- Necesario para el script deploy-php.sh (rsync)
- Ver docs/deploy.md para el procedimiento completo
