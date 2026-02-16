-- ============================
-- Flagium DB Bootstrap Script
-- ============================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS flagium
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 2. Create User
CREATE USER IF NOT EXISTS 'flagium_user'@'localhost'
IDENTIFIED BY 'TempPass123!';

-- 3. Grant Privileges
GRANT ALL PRIVILEGES ON flagium.* TO 'flagium_user'@'localhost';
FLUSH PRIVILEGES;

-- 4. Use Database
USE flagium;

-- ============================
-- Tables
-- ============================

-- Companies Master
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    sector VARCHAR(50),
    index_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financials (Annual)
CREATE TABLE IF NOT EXISTS financials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    year INT NOT NULL,
    quarter TINYINT DEFAULT 0,  -- 0=Annual, 1-4=Quarterly

    revenue BIGINT,
    net_profit BIGINT,
    profit_before_tax BIGINT,
    operating_cash_flow BIGINT,
    free_cash_flow BIGINT,

    total_debt BIGINT,
    interest_expense BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (company_id, year, quarter),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Shareholding
CREATE TABLE IF NOT EXISTS shareholding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    year INT NOT NULL,

    promoter_holding_pct DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (company_id, year),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Detected Flags (Output)
CREATE TABLE IF NOT EXISTS flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    
    flag_code VARCHAR(50),
    flag_name VARCHAR(100),
    severity VARCHAR(20),
    period_type VARCHAR(20) DEFAULT 'annual',  -- 'annual' or 'quarterly'
    fiscal_year INT,
    fiscal_quarter INT DEFAULT 0,
    message TEXT,
    details JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Flag Definitions (Optional but future-proof)
CREATE TABLE IF NOT EXISTS flag_definitions (
    flag_code VARCHAR(50) PRIMARY KEY,
    flag_name VARCHAR(100),
    description TEXT,
    severity VARCHAR(20)
);

-- ============================
-- Phase 2: Auth & Portfolios
-- ============================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'free', -- 'free' or 'pro'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Portfolios (Watchlists)
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio Items
CREATE TABLE IF NOT EXISTS portfolio_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    company_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(portfolio_id, company_id),
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
