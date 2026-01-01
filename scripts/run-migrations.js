#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_NAME = 'pegasus';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function createDatabase() {
  // Connect to postgres database to create pegasus database
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();
    log('✓ Connected to PostgreSQL server', 'green');

    // Check if database exists
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (checkDb.rows.length === 0) {
      log(`Creating database: ${DB_NAME}...`, 'cyan');
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      log(`✓ Database '${DB_NAME}' created successfully`, 'green');
    } else {
      log(`✓ Database '${DB_NAME}' already exists`, 'yellow');
    }
  } catch (error) {
    log(`✗ Error creating database: ${error.message}`, 'red');
    throw error;
  } finally {
    await client.end();
  }
}

async function runMigrations() {
  // Connect to pegasus database
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
  });

  try {
    await client.connect();
    log(`✓ Connected to database: ${DB_NAME}`, 'green');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'setup-database.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    log('✓ SQL schema file loaded', 'green');

    // Execute SQL
    log('Running migrations...', 'cyan');
    await client.query(sql);
    log('✓ All migrations executed successfully', 'green');

    // Verify tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    log('\n📊 Created tables:', 'bright');
    tables.rows.forEach((row, index) => {
      log(`   ${index + 1}. ${row.table_name}`, 'cyan');
    });

    // Display initial data
    const lotteryPool = await client.query('SELECT * FROM lottery_pool LIMIT 1');
    const buybackVolume = await client.query('SELECT * FROM buyback_volume LIMIT 1');

    log('\n💰 Initial Data:', 'bright');
    log(`   Lottery Pool: ${lotteryPool.rows[0].current_amount} SOL`, 'cyan');
    log(`   Next Milestone: ${lotteryPool.rows[0].next_milestone} SOL`, 'cyan');
    log(`   Buyback Volume: ${buybackVolume.rows[0].total_volume} SOL`, 'cyan');

    log('\n🎉 Database setup completed successfully!', 'green');
    log('\nYou can now start the bot with: npm run dev', 'yellow');

  } catch (error) {
    log(`\n✗ Migration error: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  log('\n🐴 PEGASUS PROTOCOL - Database Setup\n', 'bright');
  log('Configuration:', 'cyan');
  log(`  Host: ${DB_HOST}:${DB_PORT}`, 'cyan');
  log(`  Database: ${DB_NAME}`, 'cyan');
  log(`  User: ${DB_USER}\n`, 'cyan');

  try {
    // Step 1: Create database
    await createDatabase();

    // Step 2: Run migrations
    await runMigrations();

    log('\n✅ Setup complete! Database is ready.\n', 'green');
    process.exit(0);
  } catch (error) {
    log('\n❌ Setup failed. Please check the error messages above.\n', 'red');
    log('Common issues:', 'yellow');
    log('  • PostgreSQL is not running', 'yellow');
    log('  • Incorrect database credentials', 'yellow');
    log('  • User does not have CREATE DATABASE permission\n', 'yellow');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  log(`\n✗ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the script
main();
