# Security Scan Fix for PR #7

## Issue
The Security Scan workflow on PR #7 (branch `001-react-native-migration`) is failing due to two critical issues:

### 1. Invalid package.json Comment Fields
The `package.json` file contains invalid comment fields that npm doesn't support:
- `"_comment"`
- `"_comment_scripts"`
- `"_comment_deps"`

These fields cause `npm ci` to fail because npm treats fields in the dependencies/devDependencies sections as actual packages.

**Location:** `package.json` on branch `001-react-native-migration`

**Fix Required:**
Remove all comment fields from `package.json`. JSON doesn't support comments natively. If documentation is needed, use:
- A separate `README.md` or `CONTRIBUTING.md` file
- Package.json `"description"` field
- Code comments in JavaScript files

### 2. License Incompatibility with TruffleHog Action
The workflow uses `trufflesecurity/trufflehog@main` which has an **AGPL-3.0 license** that is not in the allowed license list.

**Location:** `.github/workflows/security-scan.yml` on branch `001-react-native-migration`

**Fix Applied:**
The TruffleHog step has been removed from the security-scan.yml workflow in this PR. The corrected workflow file is included and provides:
- npm audit for vulnerability detection
- CodeQL analysis (via separate workflow)  
- License compliance checking
- Dependency review for pull requests

## Files to Update on Branch `001-react-native-migration`

### File 1: `package.json`
Remove the following lines:
```json
"_comment": "TODO: Add npm scripts for development, linting, and build processes",
"_comment_scripts": "TODO: Add dev, build, lint, and pre-commit scripts",
"_comment_deps": "TODO: Audit dependencies for security vulnerabilities regularly"
```

### File 2: `.github/workflows/security-scan.yml`
Use the corrected version provided in this PR, which removes the TruffleHog step.

## Alternative Solution
If TruffleHog functionality is required, either:
1. Add `AGPL-3.0` to the allowed licenses list in the workflow
2. Use an alternative secrets scanning tool with a compatible license
3. Use GitHub's built-in secret scanning feature (free for public repos)

## Implementation Steps
To fix PR #7:
1. Checkout branch `001-react-native-migration`
2. Remove comment fields from `package.json`
3. Update `.github/workflows/security-scan.yml` with the version from this PR
4. Commit and push the changes
5. The security scan should now pass
