-- PEGASUS PROTOCOL Database Schema
-- PostgreSQL Database Setup Script

-- Create database (run separately if needed)
-- CREATE DATABASE pegasus;

-- Connect to pegasus database before running the rest
-- \c pegasus;

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS price_triggers CASCADE;
DROP TABLE IF EXISTS lottery_milestones CASCADE;
DROP TABLE IF EXISTS lottery_pool CASCADE;
DROP TABLE IF EXISTS buyback_volume CASCADE;
DROP TABLE IF EXISTS buyback_transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    wallet_address VARCHAR(44),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_telegram_id_check CHECK (telegram_id > 0)
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_wallet ON users(wallet_address) WHERE wallet_address IS NOT NULL;

-- Buyback transactions table
CREATE TABLE buyback_transactions (
    id SERIAL PRIMARY KEY,
    amount_sol DECIMAL(20, 9) NOT NULL,
    amount_tokens DECIMAL(20, 9) NOT NULL,
    price DECIMAL(20, 9) NOT NULL,
    tx_signature VARCHAR(88) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT buyback_amount_sol_check CHECK (amount_sol > 0),
    CONSTRAINT buyback_amount_tokens_check CHECK (amount_tokens > 0),
    CONSTRAINT buyback_price_check CHECK (price > 0),
    CONSTRAINT buyback_status_check CHECK (status IN ('pending', 'confirmed', 'failed'))
);

CREATE INDEX idx_buyback_tx_signature ON buyback_transactions(tx_signature);
CREATE INDEX idx_buyback_created_at ON buyback_transactions(created_at DESC);
CREATE INDEX idx_buyback_status ON buyback_transactions(status);

-- Buyback volume tracking table
CREATE TABLE buyback_volume (
    id SERIAL PRIMARY KEY,
    total_volume DECIMAL(20, 9) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT buyback_volume_check CHECK (total_volume >= 0)
);

-- Insert initial volume record
INSERT INTO buyback_volume (total_volume, last_updated) 
VALUES (0, CURRENT_TIMESTAMP);

-- Lottery pool table
CREATE TABLE lottery_pool (
    id SERIAL PRIMARY KEY,
    current_amount DECIMAL(20, 9) NOT NULL DEFAULT 0,
    next_milestone DECIMAL(20, 9) NOT NULL DEFAULT 30000,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lottery_pool_amount_check CHECK (current_amount >= 0),
    CONSTRAINT lottery_pool_milestone_check CHECK (next_milestone > 0)
);

-- Insert initial lottery pool record
INSERT INTO lottery_pool (current_amount, next_milestone, last_updated) 
VALUES (0, 30000, CURRENT_TIMESTAMP);

-- Lottery milestones table (history of lottery triggers)
CREATE TABLE lottery_milestones (
    id SERIAL PRIMARY KEY,
    milestone_amount DECIMAL(20, 9) NOT NULL,
    winner_wallet VARCHAR(44) NOT NULL,
    payout_amount DECIMAL(20, 9) NOT NULL,
    payout_tx VARCHAR(88),
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lottery_milestone_amount_check CHECK (milestone_amount > 0),
    CONSTRAINT lottery_payout_amount_check CHECK (payout_amount > 0)
);

CREATE INDEX idx_lottery_triggered_at ON lottery_milestones(triggered_at DESC);
CREATE INDEX idx_lottery_winner ON lottery_milestones(winner_wallet);

-- Price triggers table (automated buyback triggers)
CREATE TABLE price_triggers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trigger_price DECIMAL(20, 9) NOT NULL,
    buyback_amount DECIMAL(20, 9) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    CONSTRAINT price_trigger_price_check CHECK (trigger_price > 0),
    CONSTRAINT price_trigger_amount_check CHECK (buyback_amount > 0)
);

CREATE INDEX idx_price_triggers_user ON price_triggers(user_id);
CREATE INDEX idx_price_triggers_active ON price_triggers(active) WHERE active = true;
CREATE INDEX idx_price_triggers_price ON price_triggers(trigger_price) WHERE active = true;

-- Create a function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_buyback_volume_timestamp
    BEFORE UPDATE ON buyback_volume
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_lottery_pool_timestamp
    BEFORE UPDATE ON lottery_pool
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Grant permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;

-- Display table information
SELECT 
    'Database setup completed successfully!' as status,
    COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';

-- Display initial data
SELECT 'Initial lottery pool:' as info, current_amount, next_milestone FROM lottery_pool;
SELECT 'Initial buyback volume:' as info, total_volume FROM buyback_volume;
