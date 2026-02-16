# Flagium TODO List

## Ingestion & Parsing
- [ ] **YTD vs Standalone Calculation**: Update `ingestion/xbrl_parser.py` to automatically calculate standalone quarterly values for companies that report only YTD (accumulated) figures in their filings (e.g., RELIANCE).
    - *Context*: Current logic saves the raw value from the filing. For RELIANCE, Q2 is a 6-month sum, Q3 is a 9-month sum, leading to inflated totals when summing Q1-Q4.
    - *Proposed Fix*: Subtract (Year, Quarter-1) value from (Year, Quarter) if the context indicates YTD.

## UI & UX
- [ ] **Data Sanity Dashboard**: (In-progress) Integrate the automated sanity report into the Admin Reports tab.
