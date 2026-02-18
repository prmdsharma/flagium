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
1. **Sync Backend Code**:
   ```bash
   rsync -avz --exclude '.env' --exclude 'node_modules' --exclude '__pycache__' --exclude 'dist' -e "ssh -i ~/ocip/ssh-key-2026-02-17.key" ./ ubuntu@80.225.201.34:~/flagium/
   ```

2. **Build and Sync Frontend**:
   ```bash
   cd ui && npm run build
   rsync -avz --delete -e "ssh -i ~/ocip/ssh-key-2026-02-17.key" ui/dist/ ubuntu@80.225.201.34:~/flagium/ui/dist/
   ```

3. **Restart Backend Services**:
   Access the server and restart PM2:
   ```bash
   ssh -i ~/ocip/ssh-key-2026-02-17.key ubuntu@80.225.201.34 "pm2 restart flagium-api"
   ```

### 4. Post-Deployment Verification
- Perform a hard refresh in the browser.
- Verify the main production URL: [http://80.225.201.34/](http://80.225.201.34/)
