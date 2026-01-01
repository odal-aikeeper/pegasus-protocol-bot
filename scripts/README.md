# Database Setup Guide

This directory contains scripts to set up the PostgreSQL database for the Pegasus Protocol bot.

## Prerequisites

- PostgreSQL 14+ installed and running
- Node.js 18+ installed

## Quick Setup

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Run Database Setup

```bash
npm run setup:db
```

This will:
- Create the `pegasus` database
- Create all required tables
- Set up indexes and constraints
- Insert initial data
- Display setup confirmation

## Manual Setup

If you prefer to run the SQL manually:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE pegasus;

# Connect to the database
\c pegasus

# Run the schema file
\i scripts/setup-database.sql
```

## Database Schema

### Tables Created

1. **users** - Telegram user registrations
   - `id` (SERIAL PRIMARY KEY)
   - `telegram_id` (BIGINT UNIQUE)
   - `wallet_address` (VARCHAR(44))
   - `created_at` (TIMESTAMP)

2. **buyback_transactions** - All buyback records
   - `id` (SERIAL PRIMARY KEY)
   - `amount_sol` (DECIMAL)
   - `amount_tokens` (DECIMAL)
   - `price` (DECIMAL)
   - `tx_signature` (VARCHAR(88) UNIQUE)
   - `status` (VARCHAR(20))
   - `created_at` (TIMESTAMP)

3. **buyback_volume** - Cumulative volume tracking
   - `id` (SERIAL PRIMARY KEY)
   - `total_volume` (DECIMAL)
   - `last_updated` (TIMESTAMP)

4. **lottery_pool** - Current lottery state
   - `id` (SERIAL PRIMARY KEY)
   - `current_amount` (DECIMAL)
   - `next_milestone` (DECIMAL)
   - `last_updated` (TIMESTAMP)

5. **lottery_milestones** - Lottery history
   - `id` (SERIAL PRIMARY KEY)
   - `milestone_amount` (DECIMAL)
   - `winner_wallet` (VARCHAR(44))
   - `payout_amount` (DECIMAL)
   - `payout_tx` (VARCHAR(88))
   - `triggered_at` (TIMESTAMP)

6. **price_triggers** - Automated buyback triggers
   - `id` (SERIAL PRIMARY KEY)
   - `user_id` (INTEGER FK)
   - `trigger_price` (DECIMAL)
   - `buyback_amount` (DECIMAL)
   - `active` (BOOLEAN)
   - `created_at` (TIMESTAMP)
   - `executed_at` (TIMESTAMP)

### Initial Data

- **lottery_pool**: 0 SOL, next milestone at 30,000 SOL
- **buyback_volume**: 0 SOL

## Configuration

The migration script uses these environment variables (with defaults):

```bash
DB_USER=postgres          # PostgreSQL username
DB_PASSWORD=postgres      # PostgreSQL password
DB_HOST=localhost         # Database host
DB_PORT=5432             # Database port
```

Set them before running if your setup is different:

```bash
# Windows PowerShell
$env:DB_PASSWORD="your_password"
npm run setup:db

# Linux/macOS
DB_PASSWORD=your_password npm run setup:db
```

## Troubleshooting

### Connection Refused

**Error:** `ECONNREFUSED`

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service -Name postgresql*
   
   # Linux/macOS
   sudo systemctl status postgresql
   ```

2. Start PostgreSQL if not running:
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux
   sudo systemctl start postgresql
   
   # macOS
   brew services start postgresql
   ```

### Authentication Failed

**Error:** `password authentication failed`

**Solution:**
1. Update your password in the command:
   ```bash
   DB_PASSWORD=your_actual_password npm run setup:db
   ```

2. Or update `pg_hba.conf` to trust local connections (development only)

### Permission Denied

**Error:** `permission denied to create database`

**Solution:**
1. Connect as superuser:
   ```bash
   psql -U postgres
   ```

2. Grant privileges:
   ```sql
   ALTER USER your_username CREATEDB;
   ```

### Database Already Exists

**Warning:** `Database 'pegasus' already exists`

This is normal if you've run the setup before. The script will continue and update the schema.

To start fresh:
```bash
psql -U postgres
DROP DATABASE pegasus;
\q
npm run setup:db
```

## Switching from Mock Database

After setting up PostgreSQL, update your bot to use the real database:

1. **Update command imports** in:
   - `src/bot/commands/start.ts`
   - `src/bot/commands/buyback.ts`
   - `src/bot/commands/stats.ts`
   - `src/bot/commands/triggers.ts`

2. **Change from:**
   ```typescript
   import { mockDbService as dbService } from '../../services/database/mockDbService';
   ```

3. **Change to:**
   ```typescript
   import { dbService } from '../../services/database/dbService';
   ```

4. **Restart the bot:**
   ```bash
   npm run dev
   ```

## Verification

After setup, verify the database:

```bash
psql -U postgres -d pegasus

# List tables
\dt

# Check initial data
SELECT * FROM lottery_pool;
SELECT * FROM buyback_volume;

# Exit
\q
```

You should see all 6 tables and the initial data records.

## Backup and Restore

### Backup
```bash
pg_dump -U postgres pegasus > backup.sql
```

### Restore
```bash
psql -U postgres pegasus < backup.sql
```

## Production Notes

For production deployment:

1. **Use strong passwords**
2. **Enable SSL connections**
3. **Set up regular backups**
4. **Configure connection pooling**
5. **Monitor database performance**
6. **Set up replication** (optional)

## Support

If you encounter issues:
1. Check PostgreSQL logs
2. Verify connection settings
3. Ensure PostgreSQL is running
4. Check user permissions

For more help, see the main README.md in the project root.
