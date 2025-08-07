# 🚀 GitHub Actions Workflows

This directory contains GitHub Actions workflows that automate testing, security scanning, and deployment for the LinkedIn Clone project.

## 📋 Workflow Overview

### 🔄 Main CI Pipeline (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs:**
1. **Setup Dependencies** - Installs and caches Node.js dependencies
2. **Lint** (Parallel) - Runs ESLint for frontend and backend
3. **Test** (Parallel) - Runs unit tests with coverage
4. **Build** - Builds the frontend application
5. **Test Summary** - Generates comprehensive test reports
6. **Notify** - Sends notifications (Slack integration optional)

**Features:**
- ✅ Parallel execution for faster builds
- 📊 Test coverage reporting
- 🎯 Artifact management
- 🔄 Dependency caching
- 📱 Manual workflow dispatch with skip options

---

### 🎭 End-to-End Tests (`e2e-tests.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests, Manual dispatch

**Jobs:**
1. **E2E Testing** - Runs Playwright tests against live services

**Features:**
- 🗄️ MongoDB service container
- 🚀 Automatic server startup (frontend + backend)
- 🔍 Health checks before testing
- 📊 Test reporting with artifacts
- 💬 PR comments with results

---

### ⚡ Performance Tests (`performance-tests.yml`)
**Triggers:** Push to `main`, Pull Requests, Daily schedule, Manual dispatch

**Jobs:**
1. **Performance Testing** - Lighthouse audits, memory leak detection

**Features:**
- 🚨 Lighthouse performance scoring
- 🧠 Memory leak detection
- 📈 Performance threshold enforcement
- 📊 Detailed performance reports
- ⚠️ Automatic failure on performance regression

---

### 🔒 Security Scanning (`security-scan.yml`)
**Triggers:** Push, Pull Requests, Weekly schedule, Manual dispatch

**Jobs:**
1. **Dependency Security** - npm audit for vulnerabilities
2. **CodeQL Analysis** - Static code analysis
3. **Secret Scanning** - TruffleHog secret detection
4. **License Check** - License compliance verification
5. **Security Summary** - Consolidated security report

**Features:**
- 🔍 Multi-layer security scanning
- 🚨 Critical security alerting
- 📋 License compliance tracking
- 🎯 Automated issue creation for critical findings

---

### 🚀 Deployment Pipeline (`deploy.yml`)
**Triggers:** Push to `main`, Tags, Manual dispatch

**Jobs:**
1. **Pre-deployment Tests** - Critical smoke tests
2. **Build and Push** - Container image building
3. **Deploy Staging** - Staging environment deployment
4. **Deploy Production** - Production deployment (requires approval)
5. **Rollback** - Automatic rollback on failure
6. **Notify** - Deployment notifications

**Features:**
- 🐳 Docker container builds
- 🎯 Environment-specific deployments
- 🔒 Production approval gates
- ⏪ Automatic rollback capability
- 📢 Deployment notifications

---

### 🔒 CodeQL Analysis (`codeql.yml`)
**Triggers:** Push, Pull Requests, Weekly schedule

Dedicated security analysis for comprehensive code scanning.

---

## 🛠️ Setup Instructions

### 1. Repository Secrets
Add these secrets in GitHub repository settings:

```bash
# Optional: Slack notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Optional: Codecov integration
CODECOV_TOKEN=your_codecov_token

# Deployment secrets (if using actual deployment)
DOCKER_REGISTRY_URL=your_registry_url
DEPLOY_SSH_KEY=your_ssh_private_key
```

### 2. Environment Configuration
Configure environments in GitHub repository settings:

- **staging** - Automatic deployment from `main`
- **production** - Manual approval required

### 3. Branch Protection Rules
Set up branch protection for `main`:
- ✅ Require status checks: `lint`, `test`, `build`
- ✅ Require branches to be up to date
- ✅ Require review from code owners
- ✅ Dismiss stale reviews
- ✅ Restrict pushes to matching branches

### 4. Dependabot Configuration
The `.github/dependabot.yml` file automatically:
- 🔄 Updates dependencies weekly
- 📋 Creates PRs with proper labels
- 🎯 Maintains security patches

---

## 🎯 Usage Examples

### Manual Workflow Dispatch
You can manually trigger workflows with custom options:

```bash
# CI Pipeline with skip options
gh workflow run ci.yml -f skip_linting=true -f skip_unit_tests=false

# E2E Tests
gh workflow run e2e-tests.yml

# Performance Tests
gh workflow run performance-tests.yml

# Deploy to specific environment
gh workflow run deploy.yml -f environment=staging -f skip_tests=false
```

### Monitoring Workflow Status
```bash
# List workflow runs
gh run list

# View specific run details
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

---

## 📊 Workflow Features

### Caching Strategy
- 📦 **Node modules** - Cached across jobs
- 🎭 **Playwright browsers** - Cached for E2E tests
- 🐳 **Docker layers** - Cached for faster builds

### Parallel Execution
- 🔍 **Linting** - Frontend/backend parallel
- 🧪 **Testing** - Frontend/backend parallel
- 🔒 **Security** - Multiple scans parallel

### Artifact Management
- 📊 **Coverage reports** - 30-day retention
- 🎭 **E2E test results** - Screenshots, videos
- ⚡ **Performance reports** - Lighthouse scores
- 🏗️ **Build artifacts** - Distribution files

### Notification Integration
- 📱 **Slack** - CI/CD status updates
- 💬 **PR Comments** - Test results summary
- 🚨 **GitHub Issues** - Critical security alerts

---

## 🔧 Customization

### Adding New Tests
1. Update the appropriate workflow file
2. Add new npm scripts to `package.json`
3. Configure artifact collection if needed

### Modifying Deployment
1. Update `deploy.yml` with your deployment commands
2. Configure environment secrets
3. Set up health check endpoints

### Security Configuration
1. Customize CodeQL queries in `.github/codeql.yml`
2. Configure security thresholds
3. Set up custom secret patterns

---

## 🐛 Troubleshooting

### Common Issues

**Workflow fails on dependency installation:**
```bash
# Clear npm cache
npm cache clean --force
```

**E2E tests timeout:**
- Check server startup logs
- Verify health check endpoints
- Increase timeout values

**Performance tests fail:**
- Check Lighthouse thresholds
- Verify production build optimization
- Monitor memory usage

**Security scans fail:**
- Review npm audit output
- Check for exposed secrets
- Update vulnerable dependencies

### Debug Mode
Enable debug logging by setting repository secret:
```bash
ACTIONS_STEP_DEBUG=true
```

---

## 📈 Best Practices

### Workflow Optimization
1. **Use caching** for dependencies and build artifacts
2. **Run jobs in parallel** when possible
3. **Fail fast** for critical issues
4. **Use matrices** for multi-environment testing

### Security
1. **Never store secrets** in workflow files
2. **Use least-privilege permissions**
3. **Scan for vulnerabilities** regularly
4. **Monitor for exposed credentials**

### Monitoring
1. **Set up notifications** for critical failures
2. **Monitor workflow performance**
3. **Track success rates**
4. **Review security scan results**

---

## 🤝 Contributing

When adding new workflows:

1. 📝 **Document the purpose** and triggers
2. 🧪 **Test thoroughly** in feature branches
3. 🔒 **Follow security best practices**
4. 📊 **Add appropriate status checks**
5. 🎯 **Update this README**

For questions or issues with the CI/CD pipeline, please create an issue with the `ci/cd` label. 