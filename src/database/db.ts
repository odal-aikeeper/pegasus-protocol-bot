import Database from 'better-sqlite3'
import path from 'path'

const db = new Database(path.join(__dirname, '../../pegasus.db'))

// Create tables on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    wallet_address TEXT,
    wallet_private_key_encrypted TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS buyback_volume (
    id INTEGER PRIMARY KEY,
    total_volume REAL DEFAULT 0,
    last_updated INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS lottery_pool (
    id INTEGER PRIMARY KEY,
    current_amount REAL DEFAULT 0,
    current_market_cap REAL DEFAULT 0,
    next_milestone_market_cap REAL DEFAULT 30000,
    last_updated INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS lottery_winners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone REAL,
    winner_wallet TEXT,
    amount REAL,
    won_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS buyback_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount_sol REAL,
    amount_tokens REAL,
    price REAL,
    tx_signature TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS price_triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER,
    trigger_price REAL,
    amount_sol REAL,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
  );

  CREATE TABLE IF NOT EXISTS freeze_protocol (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    frozen INTEGER DEFAULT 0,
    freeze_date INTEGER,
    freeze_type TEXT,
    unlock_date INTEGER,
    tx_signature TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`)

// Initialize default data
const initData = db.prepare('SELECT COUNT(*) as count FROM lottery_pool').get() as { count: number }
if (initData.count === 0) {
  db.prepare('INSERT INTO lottery_pool (current_amount, current_market_cap, next_milestone_market_cap) VALUES (0, 0, 30000)').run()
  db.prepare('INSERT INTO buyback_volume (total_volume) VALUES (0)').run()
}

export default db
