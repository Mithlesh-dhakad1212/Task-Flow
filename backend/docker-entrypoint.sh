#!/bin/sh
set -e

echo "› Applying database migrations"
npx prisma migrate deploy

if [ "$SEED_DEMO" = "true" ]; then
  echo "› Seeding demo data"
  node dist-seed/seed.js
fi

exec "$@"
