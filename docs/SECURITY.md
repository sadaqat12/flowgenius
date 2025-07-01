# Security Guidelines

## Overview

This document outlines security practices and tools for the Service Call Manager project.

## Secret Scanning with Gitleaks

### Installation

#### macOS (using Homebrew)
```bash
brew install gitleaks
```

#### Linux/macOS (using curl)
```bash
# Download latest release
curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/scripts/install.sh | sh -s -- -b /usr/local/bin
```

#### Windows (using Chocolatey)
```bash
choco install gitleaks
```

#### Verify Installation
```bash
gitleaks version
```

### Usage

#### Scan Entire Repository
```bash
npm run security:scan
```

#### Scan Staged Files (Pre-commit)
```bash
npm run security:scan-staged
```

#### Create Baseline (for existing repositories)
```bash
npm run security:baseline
```

### Configuration

Gitleaks is configured via `.gitleaks.toml` with:
- Custom rules for Electron applications
- Environment file scanning
- Database credential detection
- Allowlist for false positives

### What Gitleaks Detects

- **API Keys**: AWS, Google Cloud, GitHub tokens
- **Database Credentials**: Connection strings, passwords
- **Environment Variables**: Sensitive configuration
- **Private Keys**: SSH, SSL certificates
- **Application Secrets**: JWT tokens, session keys

### Best Practices

1. **Never commit secrets** to the repository
2. Use **environment variables** for sensitive data
3. Use **`.env` files** (excluded from Git)
4. Run **pre-commit scans** before pushing
5. Regularly **audit** the repository for secrets

### Environment Variables

Create a `.env` file for local development:
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your actual values
# Never commit .env to Git!
```

### Pre-commit Hook

Add Gitleaks to your Git pre-commit hooks:
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run security:scan-staged
```

## Additional Security Measures

### 1. Dependency Scanning
```bash
npm audit
npm audit fix
```

### 2. License Compliance
```bash
npm run license-check  # To be implemented
```

### 3. Code Quality
```bash
npm run lint
npm run type-check
```

### 4. Electron Security

Follow Electron security best practices:
- **Context Isolation**: Enabled in `main.ts`
- **Node Integration**: Disabled in renderer
- **Preload Scripts**: Used for secure IPC
- **CSP Headers**: To be implemented
- **Secure Defaults**: No `allowRunningInsecureContent`

### 5. Database Security

- Use **parameterized queries** to prevent SQL injection
- **Encrypt sensitive data** at rest
- **Hash passwords** with bcrypt
- **Validate input** on both client and server

## Incident Response

If a secret is accidentally committed:

1. **Immediately rotate** the compromised secret
2. **Remove from Git history** using BFG or git-filter-repo
3. **Scan entire history** for other secrets
4. **Update security procedures** to prevent recurrence

### Remove from Git History
```bash
# Using BFG Repo-Cleaner (recommended)
git clone --mirror git@github.com:user/repo.git
java -jar bfg.jar --replace-text passwords.txt repo.git
cd repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

## Reporting Security Issues

Report security vulnerabilities privately to:
- Email: [security-email]
- GitHub Security Advisories: [Private reporting]

## Compliance

This project follows:
- **OWASP Top 10** security guidelines
- **Electron Security** best practices
- **NIST Cybersecurity Framework** principles

## Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/) 