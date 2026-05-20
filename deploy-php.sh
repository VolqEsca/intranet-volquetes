#!/bin/bash
rsync -avz \
  --exclude 'config.php' \
  --exclude '.htaccess' \
  --exclude '*.log' \
  --exclude 'php_errorlog' \
  --exclude 'repair-*.php' \
  --exclude 'vendor/' \
  -e "ssh -p 18765 -i ~/.ssh/verso-siteground" \
  ./api/ \
  u1340-y6xgrhky6mas@gnld1033.siteground.eu:~/www/intranet.volquetesescalante.com/public_html/api/
