---
description: How to deploy the application to production from the main branch
---

This workflow defines the standard procedure for deploying changes to the production server at `80.225.201.34`.

### 1. Preparation & Testing
- All development must happen on the `dev` branch or feature branches.
- Thoroughly test all changes locally on the development environment.
- Ensure the build is successful:
  ```bash
  cd ui && npm run build
  ```

### 2. Merging to Main
Once testing is complete and verified:
- Merge the `dev` branch into `main`.
- Push `main` to the remote repository:
  ```bash
  git checkout main
  git merge dev
  git push origin main
  ```

### 3. Production Deployment from Main
// turbo
1. **Run Deployment Script**:
   Execute the automated deployment script from the project root. This script handles building the frontend, syncing the backend (while safely excluding the virtual environment), and restarting the PM2 services:
   ```bash
   ./scripts/deploy.sh
   ```

### 4. Post-Deployment Verification
- Perform a hard refresh in the browser.
- Verify the main production URL: [https://flagiumai.com/](https://flagiumai.com/)
- Verify the API is responsive: [https://flagiumai.com/api/ping](https://flagiumai.com/api/ping)
