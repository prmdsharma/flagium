# Flagium Technical Architecture

## 1. Executive Summary
**Flagium** is a dedicated risk intelligence platform designed to detect early warning signals in Indian public companies. It automates financial forensic analysis by ingesting raw XBRL filings from NSE/BSE, normalizing the data, and running a deterministic flag engine to identify governance, liquidity, and operational risks.

---

## 2. High-Level Architecture (HLD)

### 2.1 System Context
Flagium operates as a standalone web application that interfaces with:
- **NSE/BSE (External)**: Source of raw XBRL financial filings and corporate announcements.
- **Market Data Providers (External)**: Source for real-time stock prices (e.g., Yahoo Finance/Broker APIs).
- **Users**: Portfolio managers and analysts accessing the dashboard.

### 2.2 Component Diagram
The system is composed of four primary subsystems:

1.  **Frontend (UI)**:
    -   **Tech**: React, Vite, TailwindCSS.
    -   **Role**: Interactive dashboard for risk monitoring, portfolio attribution, and signal visualization.
    -   **Deployment**: Static Asset / SPA.

2.  **API Gateway & Server**:
    -   **Tech**: Python (FastAPI), Uvicorn.
    -   **Role**: REST API endpoints, Authentication (JWT), Portfolio Management logic.
    -   **State**: Stateless API layer.

3.  **Core Engine (Worker)**:
    -   **Tech**: Python.
    -   **Role**: Background processing for:
        -   **Ingestion**: Fetching and parsing XBRL files.
        -   **Flag Engine**: Running risk algorithms (`core.engine`).
        -   **Scoring**: Calculating proprietary Risk Scores (0-100).
    -   **Execution**: Scheduled Cron jobs / Async Workers.

4.  **Data Persistence**:
    -   **Tech**: PostgreSQL (with TimescaleDB extension optional for time-series).
    -   **Role**: Relational storage for companies, financials, signals, and portfolios.

---

## 3. Low-Level Design (LLD)

### 3.1 Data Ingestion Module
Located in `ingestion/`, this module handles the raw data pipeline.

*   **Fetcher (`xbrl_downloader.py`)**: Scrapes exchange websites or APIs for recent filings.
*   **Parser (`xbrl_parser.py`)**:
    *   Uses `lxml` to parse complex XBRL naming schemas (IndAS, Indian GAAP).
    *   **Normalization**: Maps heterogeneous taxonomy tags (e.g., `RevenueFromOperations`, `TotalIncome`) to a standard internal schema (`revenue`, `net_profit`).
    *   **Period Resolution**: Classifies data into Annual vs. Quarterly periods based on context dates.
*   **Sanity Check (`sanity.py`)**: Validates accounting identities (e.g., Assets = Liabilities + Equity) before commits.

### 3.2 Flag Engine
Located in `core/engine.py` and `core/flags/`.

*   **Architecture**: Strategy Pattern.
*   **Base Class**: `FlagStrategy` (Abstract).
    *   Method: `calculate(financials: DataFrame) -> Signal | None`.
*   **Implementations**:
    *   `LowInterestCoverage`: Checks `EBIT / Interest < 1.5`.
    *   `ProfitCollapse`: Checks `(NetProfit_t - NetProfit_t-1) / NetProfit_t-1 < -0.5`.
    *   `Divergence`: Compares Revenue growth vs. Operating Cash Flow growth.
*   **Execution**: The engine loads all enabled strategies and applies them to the normalized financial time series for every company.

### 3.3 Portfolio Manager
Located in `api/portfolios.py`.

*   **Attribution Logic**:
    *   Maps User Portfolios -> Holdings (Tickers) -> Risk Signals.
    *   **Weighted Risk Score**: Calculates portfolio-level risk based on capital allocation.
    *   **Escalation Filtering**: Surfaces only "Active" (last 2 quarters) and "High Severity" signals for the dashboard.

### 3.4 Database Schema
Key entities in PostgreSQL:

*   **`companies`**: Master list (Ticker, ISIN, Sector).
*   **`financials`**: Time-series financial data.
    *   Columns: `company_id`, `year`, `quarter`, `revenue`, `profit`, `debt`, `cash_flow`.
    *   Unique Constraint: `(company_id, year, quarter)`.
*   **`flags`**: Detected signals.
    *   Columns: `company_id`, `flag_name`, `severity`, `quarter`, `year`, `value` (e.g., "Interest Cov: 0.8"), `status` (Active/Resolved).
*   **`portfolios`** & **`portfolio_items`**: User holdings and investment values.

---

## 4. Data Flow

1.  **Ingestion Request**: Triggered via Scheduler or Admin API.
2.  **Download**: System fetches ZIP/XML from Exchange.
3.  **Parse & Normalize**: XML -> JSON Record (Uniform Standard).
4.  **Persist**: Data stored in `financials` table.
5.  **Signal Generation**:
    *   Engine queries `financials` (Last 8 quarters).
    *   Runs 50+ Flag Strategies.
    *   Persists positive signals to `flags` table.
6.  **Scoring**:
    *   Aggregator computes `risk_score` (0-100) per company based on active flags and weights.
7.  **Consumption**:
    *   User loads Dashboard.
    *   API queries `portfolios` JOIN `companies` JOIN `flags`.
    *   UI renders "High Risk" alerts.

---

## 5. Deployment Architecture
*   **Dockerized**: The app is containerized (`Dockerfile`) for consistent deployment.
*   **Reverse Proxy**: Nginx (Production) handles SSL and routing to FastAPI (Port 8000) and React Static Files.
*   **Process Management**:
    *   `gunicorn`/`uvicorn`: for API.
    *   `custom_scheduler`: for Ingestion jobs.

## 6. Known Issues & Roadmap
*   **YTD Parsing Logic**: Current parser sums Year-To-Date values for Q4 as a discrete quarter if the filing doesn't explicitly separate them. Roadmap Item: Implement YTD subtraction logic in `xbrl_parser.py`.
*   **Real-time Price**: Currently relies on end-of-day sync. Integration with WebSocket feed is planned for V2.
