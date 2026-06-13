#!/bin/sh
set -e

mkdir -p storage/contracts storage/repair-orders storage/invoices

echo "Checking Chromium for PDF generation..."
CHROMIUM_PATH="${PUPPETEER_EXECUTABLE_PATH:-/usr/bin/chromium-browser}"
if [ -x "$CHROMIUM_PATH" ]; then
  echo "Chromium found at $CHROMIUM_PATH"
elif [ -x /usr/bin/chromium-browser ]; then
  echo "Chromium found at /usr/bin/chromium-browser"
  export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
elif [ -x /usr/bin/chromium ]; then
  echo "Chromium found at /usr/bin/chromium"
  export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
else
  echo "WARNING: Chromium executable not found. PDF generation will fail until Chromium is installed."
fi

echo "Applying database migrations..."
npx prisma migrate deploy

echo "Migration status:"
npx prisma migrate status

echo "Starting backend API..."
exec node dist/server.js
