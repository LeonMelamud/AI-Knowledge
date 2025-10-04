# Security Policy

## Security Scanning Overview

This repository uses multiple security scanning tools to ensure code quality and safety:

1. **CodeQL Analysis** - Runs on push to main/develop branches and weekly (Monday 6:25 AM)
2. **Security Scan** - Runs on pull requests only to validate changes
3. **Dependabot** - Weekly automated dependency updates
4. **TruffleHog** - Secret scanning (runs with security-scan workflow)

## Current Vulnerability Status

As of the latest scan, we have:
- **Total Vulnerabilities**: 3 moderate severity issues (down from 14)
- **Fixed**: 11 vulnerabilities addressed via `npm audit fix`

### Remaining Issues

#### 1. Mocha Dependencies (nanoid & serialize-javascript)
- **Severity**: Moderate (2 issues)
- **Impact**: Development/testing only - does not affect production
- **CVEs**: 
  - nanoid: GHSA-mwcw-c2x4-8c55 (Predictable results in nanoid generation)
  - serialize-javascript: GHSA-76p7-773f-r4q5 (XSS vulnerability)
- **Effort to Fix**: 2-4 hours
- **Solution**: 
  - Upgrade mocha from v9.1.3 to v11.7.4
  - This is a major version upgrade that may require:
    - Updating test syntax for breaking changes
    - Verifying all tests still pass
    - Reviewing mocha migration guides (v9 → v10 → v11)
- **Risk**: Low - only affects development environment
- **Recommendation**: Schedule during next development cycle

#### 2. Additional Dev Dependencies
- **Severity**: Low-Moderate
- **Impact**: Development environment only
- **Effort to Fix**: 1-2 hours
- **Solution**: Run `npm audit fix --force` to apply breaking changes
- **Risk**: Medium - may require test updates

## Security Workflow Optimization

### Changes Implemented

Previously, we had duplicate scanning that caused:
- Redundant alerts on the same issues
- Increased GitHub Actions usage
- Slower CI/CD pipelines

**Before:**
- CodeQL: Runs on push (main, develop) + weekly schedule + pull requests
- Security-scan: Runs on push (main, develop, migration branch) + weekly schedule + pull requests
- Result: Each push triggered 2 scans, each PR triggered 2 scans, 2 weekly scans

**After:**
- CodeQL: Runs on push (main, develop) + weekly schedule + pull requests (comprehensive code analysis)
- Security-scan: Runs on pull requests only (quick dependency/secret checks)
- Result: Single comprehensive scan on push, PR gets both scans for validation, single weekly scan

**Benefits:**
- ~50% reduction in duplicate scanning
- Faster feedback on PRs (security-scan is quicker than full CodeQL)
- Less noise in security alerts
- Reduced GitHub Actions usage

## Reporting a Vulnerability

If you discover a security vulnerability, please email leon.melamud@example.com or create a private security advisory through GitHub.

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and provide a fix timeline within 1 week for critical issues.

## Security Best Practices

### For Contributors

1. **Never commit secrets** - Use environment variables for sensitive data
2. **Keep dependencies updated** - Review Dependabot PRs promptly
3. **Run security checks locally** - Use `npm audit` before committing
4. **Review security alerts** - Check GitHub Security tab regularly

### For Maintainers

1. **Weekly Security Review** - Check automated scan results every Monday
2. **Prioritize Critical/High Issues** - Address within 1 week
3. **Update Dependencies Regularly** - At least monthly for security patches
4. **Document Security Decisions** - Record why vulnerabilities are accepted (if applicable)

## Vulnerability Remediation Timeline

| Severity | Initial Response | Fix Target | Notes |
|----------|-----------------|------------|-------|
| Critical | 24 hours | 3 days | Immediate hotfix if needed |
| High | 48 hours | 1 week | Schedule fix in current sprint |
| Moderate | 1 week | 2 weeks | Include in next release |
| Low | 2 weeks | 1 month | Batch with other updates |

## Automation & Monitoring

- **Dependabot**: Automatically creates PRs for dependency updates
- **CodeQL**: Deep static analysis for code vulnerabilities
- **npm audit**: Checks for known vulnerabilities in dependencies
- **TruffleHog**: Scans for accidentally committed secrets
- **License Checker**: Ensures only approved open-source licenses

## Total Effort Estimate for Current Issues

| Task | Estimated Effort | Priority |
|------|-----------------|----------|
| Upgrade Mocha to v11 | 2-4 hours | Medium |
| Test verification after upgrade | 1-2 hours | Medium |
| Apply remaining audit fixes | 1-2 hours | Low |
| Documentation updates | 0.5 hours | Low |
| **Total** | **4.5-8.5 hours** | - |

**Recommended Approach**: Schedule a focused security maintenance sprint (1 day) to:
1. Upgrade mocha and update tests (morning)
2. Run full test suite and fix any breaking changes (afternoon)
3. Apply remaining fixes and verify (end of day)
4. Update documentation and release notes

This approach allows for proper testing and reduces risk of breaking the test suite incrementally.
