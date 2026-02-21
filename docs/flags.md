# Flagium AI — Flags & Risk Scoring Documentation

## Overview

The Flagium AI flag engine detects financial risk signals (flags) across companies by analyzing financial data. Each flag represents a specific type of financial deterioration. Flags are stored in the database and used to compute a composite **Risk Score** (0–100) for each company.

---

## Architecture

```
┌─────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│  Financial Data  │ ───▶ │   Flag Engine      │ ───▶ │   flags table    │
│  (financials)    │      │  (engine/runner.py) │      │   (DB)           │
└─────────────────┘      └───────────────────┘      └──────────────────┘
                                                            │
                         ┌───────────────────┐              │
                         │  flag_definitions  │◀─── JOIN ───┘
                         │  (DB - metadata)   │              │
                         └───────────────────┘              ▼
                                                   ┌──────────────────┐
                                                   │  Scoring Engine  │
                                                   │ (api/scoring.py) │
                                                   └──────────────────┘
                                                            │
                                                            ▼
                                                   Risk Score (0-100)
                                                   + Classification
                                                   + Narrative
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| Flag Modules | `flags/*.py` | Detection logic for each flag |
| Flag Registry | `flags/__init__.py` | Active flags to execute |
| Engine Runner | `engine/runner.py` | Orchestrates flag execution per company/period |
| Flag Definitions | `flag_definitions` table | DB-driven metadata (category, impact_weight) |
| Scoring Engine | `api/scoring.py` | Computes Risk Score from flags |

---

## Flag Definitions (Database)

All flag metadata is stored in the `flag_definitions` table:

```sql
CREATE TABLE flag_definitions (
    flag_code       VARCHAR(50) PRIMARY KEY,
    flag_name       VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    impact_weight   INT NOT NULL DEFAULT 5,
    description     TEXT,
    params          JSON,
    is_active       TINYINT(1) DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Current Flag Inventory

| Code | Flag Name | Category | Impact Weight | Quarterly Support |
|------|-----------|----------|:---:|:---:|
| F1 | OCF < PAT | Earnings Quality | 4 | ❌ |
| F2 | Negative FCF Streak | Governance | 4 | ❌ |
| F3 | Revenue-Debt Divergence | Balance Sheet Stress | 5 | ❌ |
| F4 | Low Interest Coverage | Balance Sheet Stress | 5 | ✅ |
| F5 | Profit Collapse | Earnings Quality | 5 | ✅ |

### Risk Categories

| Category | Description |
|----------|-------------|
| **Balance Sheet Stress** | Flags related to debt, leverage, and solvency |
| **Earnings Quality** | Flags indicating profit/cash flow mismatches |
| **Governance** | Flags related to capital allocation and pledging |

---

## Flag Details

### F1: OCF < PAT (Operating Cash Flow less than Net Profit)

**File:** `flags/ocf_vs_pat.py`

| Attribute | Value |
|-----------|-------|
| Category | Earnings Quality |
| Severity | HIGH |
| Data Required | Annual: `net_profit`, `operating_cash_flow` |
| Quarterly Support | No (quarterly OCF not available) |

**Rule:** Triggers if Operating Cash Flow < Net Profit in **at least 2 of the last 3 years**.

**Parameters:**
- `lookback`: 3 years
- `threshold_count`: 2 years

**What it means:** Reported profit is not backed by actual cash generation. This can indicate aggressive revenue recognition, working capital deterioration, or one-time non-cash gains inflating profit.

**Example:** If a company reports ₹100 Cr net profit but generates only ₹60 Cr in operating cash flow for 2 out of 3 years, the flag triggers.

---

### F2: Negative FCF Streak

**File:** `flags/negative_fcf.py`

| Attribute | Value |
|-----------|-------|
| Category | Governance |
| Severity | HIGH |
| Data Required | Annual: `free_cash_flow` |
| Quarterly Support | No (quarterly FCF not available) |

**Rule:** Triggers if Free Cash Flow < 0 for **3 consecutive years**.

**Parameters:**
- `streak_years`: 3

**What it means:** The company is burning cash year after year. Persistent negative FCF means the company cannot fund operations and growth internally, increasing reliance on debt or equity dilution.

**Example:** FCF of -₹50 Cr (2023), -₹30 Cr (2024), -₹80 Cr (2025) → flag triggers.

---

### F3: Revenue-Debt Divergence

**File:** `flags/revenue_debt_divergence.py`

| Attribute | Value |
|-----------|-------|
| Category | Balance Sheet Stress |
| Severity | MEDIUM |
| Data Required | Annual: `revenue`, `total_debt` |
| Quarterly Support | No (quarterly total_debt not available) |

**Rule:** Triggers if **Revenue declines** AND **Total Debt increases** compared to the previous year.

**Parameters:** None (simple YoY comparison)

**What it means:** The company is borrowing more while its top line shrinks — a classic sign of financial deterioration. The business may be taking on debt to cover operational shortfalls.

**Example:** Revenue falls from ₹500 Cr to ₹450 Cr while debt rises from ₹200 Cr to ₹250 Cr → flag triggers.

---

### F4: Low Interest Coverage

**File:** `flags/interest_coverage.py`

| Attribute | Value |
|-----------|-------|
| Category | Balance Sheet Stress |
| Severity | HIGH (< 1.5x) / MEDIUM (< 2.5x) |
| Data Required | `profit_before_tax`, `interest_expense` |
| Quarterly Support | ✅ Yes |

**Rule:** Triggers if Interest Coverage Ratio (ICR) < 2.5x, where:

```
EBIT = Profit Before Tax + Interest Expense
ICR  = EBIT / Interest Expense
```

**Severity Thresholds:**
- ICR < **1.5x** → `HIGH` (company can barely cover interest)
- ICR < **2.5x** → `MEDIUM` (thin margin of safety)

**Parameters:**
- `high_severity_threshold`: 1.5
- `medium_severity_threshold`: 2.5

**What it means:** The company's operating earnings are insufficient to comfortably service its debt interest obligations. An ICR below 1.5x means the company may struggle to meet interest payments.

**Example:** PBT = ₹10 Cr, Interest = ₹8 Cr → EBIT = ₹18 Cr → ICR = 2.25x → MEDIUM flag.

---

### F5: Profit Collapse

**File:** `flags/profit_collapse.py`

| Attribute | Value |
|-----------|-------|
| Category | Earnings Quality |
| Severity | HIGH |
| Data Required | `net_profit` |
| Quarterly Support | ✅ Yes (YoY quarter comparison) |

**Rule:** Triggers if Net Profit drops by **more than 50%** compared to the previous period.

- **Annual:** Compares current year vs previous year.
- **Quarterly:** Compares same quarter YoY (e.g., Q3 FY2025 vs Q3 FY2024).

**Parameters:**
- `drop_threshold`: 0.5 (50%)

**Guard conditions:**
- Previous profit must be > 0 (avoids false positives from loss recovery)
- Current profit must be < 50% of previous profit

**What it means:** A sudden and significant collapse in profitability, which may indicate loss of competitive advantage, regulatory impact, or one-time charges.

**Example:** Net Profit drops from ₹100 Cr (Q3 FY2024) to ₹40 Cr (Q3 FY2025) → 60% drop → flag triggers.

---

## Risk Score Calculation

The Risk Score is computed in `api/scoring.py` using the `calculate_risk_score()` function.

### Formula

```
risk_score = min(100, Σ weight_per_flag)
```

Where each flag's weight is determined by its `impact_weight` from the `flag_definitions` table:

```python
if impact_weight >= 5:    # HIGH impact
    weight = 15
else:                     # MEDIUM impact
    weight = 10
```

### Example: NUVOCO (2 flags)

| Flag | impact_weight | Weight |
|------|:---:|:---:|
| F4 - Low Interest Coverage | 5 | +15 |
| F5 - Profit Collapse | 5 | +15 |
| **Total** | | **30** |

`risk_score = min(100, 30) = 30`

### Risk Classification

| Risk Score Range | Status | Description |
|:---:|---|---|
| **0 – 14** | Stable | No significant risk signals |
| **15 – 34** | Watchlist | Early warning signs present |
| **35 – 59** | Early Stress | Multiple risk factors active |
| **60 – 100** | Structural Deterioration | Critical risk concentration |

### Primary Driver

The **Primary Driver** is the risk category with the highest accumulated weight:

```python
primary_driver = max(cat_scores, key=cat_scores.get) if risk_score > 0 else "No Active Risk"
```

If risk_score is 0, it displays **"No Active Risk"** instead of defaulting to a category.

---

## Flag Engine Execution

The flag engine (`engine/runner.py`) runs on a per-company, per-period basis:

### Invocation

```bash
# Run for all companies (latest quarter only)
python main.py flags

# Run for a specific company with backfill
python main.py flags --ticker RELIANCE --backfill 8

# Full backfill for all companies
python main.py flags --backfill 8
```

### Execution Flow

1. **Determine target periods** based on current fiscal quarter and backfill count
2. **For each company:**
   - For each target period (year, quarter):
     - Delete existing flags for that company+period (avoids duplicates)
     - Run each flag module:
       - **Quarterly check** (if flag supports quarterly data)
       - **Annual check** (only when `quarter == 4`, to avoid duplicates)
     - Set `fiscal_year` and `fiscal_quarter` on each result
     - Save to `flags` table via `save_flag()`
3. **Commit** all changes

### Database: `flags` Table

```sql
INSERT INTO flags (
    company_id,
    flag_code, flag_name, severity,
    period_type, fiscal_year, fiscal_quarter,
    message, details
) VALUES (...)
```

| Column | Type | Description |
|--------|------|-------------|
| `company_id` | INT | FK to `companies.id` |
| `flag_code` | VARCHAR | e.g., "F1", "F5" |
| `flag_name` | VARCHAR | Human-readable name |
| `severity` | VARCHAR | "HIGH" or "MEDIUM" |
| `period_type` | VARCHAR | "annual" or "quarterly" |
| `fiscal_year` | INT | Year the flag relates to |
| `fiscal_quarter` | INT | Quarter (0 = annual, 1-4 = quarterly) |
| `message` | TEXT | Contextual explanation |
| `details` | JSON | Detailed evidence and metrics |

---

## Adding a New Flag

To add a new flag to the system:

### Step 1: Create the Flag Module

Create a new file in `flags/` following this template:

```python
"""
Flag: [Flag Name]

Detects [what it detects].
Rule: [Trigger condition].
Severity: [HIGH/MEDIUM]
"""

FLAG_CODE = "F6"           # Next available code
FLAG_NAME = "My New Flag"
SEVERITY = "HIGH"

SUPPORTS_QUARTERLY = False  # Set True if quarterly data is available

def check(conn, company_id, ticker, period_type="annual", year=None, quarter=None):
    """Check logic here."""
    if period_type == "quarterly" and not SUPPORTS_QUARTERLY:
        return None

    cursor = conn.cursor(dictionary=True)
    # ... query financial data ...
    # ... apply detection logic ...

    if condition_met:
        return {
            "flag_code": FLAG_CODE,
            "flag_name": FLAG_NAME,
            "severity": SEVERITY,
            "period_type": period_type,
            "message": f"{ticker}: Description of what was detected.",
            "details": { ... }
        }
    return None
```

### Step 2: Register the Flag

Add the module to `flags/__init__.py`:

```python
from flags import my_new_flag

FLAG_REGISTRY = [
    ocf_vs_pat,
    negative_fcf,
    revenue_debt_divergence,
    interest_coverage,
    profit_collapse,
    my_new_flag,         # ← Add here
]
```

### Step 3: Add to `flag_definitions` Table

Insert the metadata into the database:

```sql
INSERT INTO flag_definitions (flag_code, flag_name, category, impact_weight, description, params)
VALUES ('F6', 'My New Flag', 'Earnings Quality', 5, 'Description here', '{"param1": "value1"}');
```

Or add it to `db/seed_flags.py` for repeatability.

### Step 4: Run the Engine

```bash
python main.py flags --backfill 8
```

---

## Data Dependencies

| Flag | Required Financial Fields | Period |
|------|--------------------------|--------|
| F1 | `net_profit`, `operating_cash_flow` | Annual only |
| F2 | `free_cash_flow` | Annual only |
| F3 | `revenue`, `total_debt` | Annual only |
| F4 | `profit_before_tax`, `interest_expense` | Annual + Quarterly |
| F5 | `net_profit` | Annual + Quarterly |

> **Note:** Flags F1, F2, and F3 are annual-only because quarterly operating cash flow, free cash flow, and total debt are not available in the current data model.
