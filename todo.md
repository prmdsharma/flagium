# Risk Score Centralization & Logic Updates

## ~~1. Centralize Scoring Logic~~ (Completed)
- **Issue**: `api/routes.py` (Company Page) and `api/portfolios.py` (Portfolio Page) currently calculate the "Risk Score" using separate code blocks. `routes.py` deduplicates flags, while `portfolios.py` sums all rows, leading to large discrepancies like Patanjali's (+60) jump.
- **Action**: Extract the Risk Score mathematical calculation into a single, shared utility function (e.g., in `src/utils.py`).
- **Goal**: Both endpoints must call this single function so a company's score is identical regardless of where it is viewed.

## 2. Implement Dynamic Frequency Scoring
- **Issue**: Currently, historical flags or repeated flags aren't explicitly weighted against each other logically. 
- **Action**: Await the custom scoring logic from the user. The new centralized function must accommodate:
  - [ ] If a flag appears **one time** (e.g., single penalty).
  - [ ] If a flag appears **multiple times** (e.g., escalating penalty).
  - [x] If a flag appeared **in the past** but not recently (e.g., decaying penalty).

## 3. Institutional Risk Model (Advanced Phases)
To evolve Flagium AI into a serious institutional-grade risk monitoring platform, the following modules are planned:

- [ ] **Debt Maturity Ladder Analysis**: Granular breakdown of short-term vs long-term refinancing risks.
- [ ] **Advanced Liquidity Ratios**: Integration of Quick Ratio and Current Ratio thresholds.
- [ ] **Covenant Breach Probability**: Predictive modeling of debt covenant triggers.
- [ ] **Off-Balance Sheet Exposure**: Tracking contingent liabilities and hidden risks.
- [ ] **Working Capital Deterioration**: Monitoring inventory/debtor cycles and cash conversion.
- [ ] **Altman Z-Score Model**: Composite scoring for bankruptcy prediction.
- [ ] **Sector Normalization**: Adjusting risk weights based on industry-specific averages.
- [ ] **Macro Sensitivity**: Stress testing against interest rates and inflation shocks.