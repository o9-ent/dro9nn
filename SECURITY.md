# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

The o9nn team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **GitHub Security Advisories**: Use the [Security tab](https://github.com/o9nn/dro9nn/security/advisories/new) to privately report a vulnerability.

2. **Email**: Send an email to [security@o9nn.org](mailto:security@o9nn.org) with:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Communication**: We will keep you informed about our progress in addressing the vulnerability.
- **Resolution**: We will work to understand and resolve the issue as quickly as possible.
- **Disclosure**: We will coordinate with you regarding the public disclosure timeline.

### Safe Harbor

We consider security research conducted according to this policy to be:

- Authorized in accordance with any applicable anti-hacking laws
- Exempt from restrictions in our Terms of Service that would interfere with conducting security research

We will not pursue civil action or initiate a complaint to law enforcement for accidental, good-faith violations of this policy.

## Security Best Practices

When using o9nn packages, please follow these security best practices:

### Dependencies

- Regularly update dependencies to get security patches
- Use `pnpm audit` or `npm audit` to check for known vulnerabilities
- Use `pip-audit` for Python dependencies
- Use `govulncheck` for Go modules

### API Keys and Secrets

- Never commit API keys or secrets to the repository
- Use environment variables for sensitive configuration
- Rotate credentials regularly
- Use secret management tools in production

### Model Security

- Validate model inputs to prevent injection attacks
- Be cautious with user-provided models
- Monitor for adversarial inputs
- Implement rate limiting for inference endpoints

### Infrastructure

- Keep container images updated
- Use non-root users in containers
- Enable security scanning in CI/CD
- Follow the principle of least privilege

## Security Features

The o9nn monorepo includes several security features:

### Automated Scanning

- **CodeQL**: Static analysis for security vulnerabilities
- **Dependabot**: Automated dependency updates
- **Secret Scanning**: Detection of committed secrets
- **Container Scanning**: Vulnerability detection in Docker images

### CI/CD Security

- All dependencies are verified before installation
- Build artifacts are signed
- Release integrity is verified with checksums

## Security Updates

Security updates are released as:

- Patch versions for minor vulnerabilities
- Minor versions for significant security improvements
- Security advisories for critical vulnerabilities

Subscribe to our security mailing list or watch the repository for security announcements.

## Contact

For security concerns, contact:
- Email: [security@o9nn.org](mailto:security@o9nn.org)
- GPG Key: Available upon request

## Acknowledgments

We thank the security researchers who have helped improve o9nn security. Contributors are acknowledged in our security advisories unless they prefer to remain anonymous.
