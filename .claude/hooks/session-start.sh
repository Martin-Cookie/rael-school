#!/bin/bash
set -euo pipefail

# Only run in remote (web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="rael-school-secret-key"
ENVEOF
fi

# Generate Prisma client
npx prisma generate

# Push schema to database (creates dev.db if needed)
npx prisma db push

# Seed database if it's empty (check if users exist)
if ! npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { p.\$disconnect(); process.exit(c > 0 ? 0 : 1); });
" 2>/dev/null; then
  npm run db:seed
fi

echo "Session start hook completed successfully"
