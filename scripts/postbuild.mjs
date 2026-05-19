import { symlinkSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const distApi = resolve(root, 'dist/api');
const apiSrc = resolve(root, 'api');

if (existsSync(distApi)) unlinkSync(distApi);
symlinkSync(apiSrc, distApi);
console.log('✓ symlink dist/api →', apiSrc);

const htaccess = `Options -MultiViews +FollowSymLinks

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteRule ^api/login$ api/login.php [NC,L]
  RewriteRule ^api/logout$ api/logout.php [NC,L]
  RewriteRule ^api/dashboard/summary$ api/dashboard/summary.php [NC,L]
  RewriteRule ^api/clients/import$ api/clients/import.php [NC,L]
  RewriteRule ^api/orders/?$ api/orders/index.php [NC,L]
  RewriteRule ^api/clients/?$ api/clients/index.php [NC,L]
  RewriteRule ^api/users/?$ api/users/index.php [NC,L]

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/app-assets/
  RewriteRule . /index.html [L]
</IfModule>
`;

writeFileSync(resolve(root, 'dist/.htaccess'), htaccess);
console.log('✓ dist/.htaccess escrito');
