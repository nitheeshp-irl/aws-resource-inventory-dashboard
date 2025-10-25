# Security Guidelines

## 🔒 Pre-commit Security Checklist

Before pushing to git, ensure you've completed these security checks:

### ✅ Sensitive Data Removal
- [ ] No AWS Access Keys or Secret Keys in code
- [ ] No database files (`.sqlite`, `.db`) committed
- [ ] No `.env` files with real credentials
- [ ] No hardcoded passwords or API keys
- [ ] No personal or production data in test files

### ✅ File Exclusions
The following files/directories are automatically ignored by `.gitignore`:
- `node_modules/` - Dependencies
- `*.env*` - Environment files
- `*.db`, `*.sqlite*` - Database files
- `backend/data/` - Database directory
- `backend/logs/` - Log files
- `.aws/` - AWS credentials directory
- `*.log` - Log files
- `coverage/` - Test coverage reports

### ✅ Environment Setup
1. Copy `backend/env.example` to `backend/.env`
2. Update the `.env` file with your actual values:
   ```bash
   cp backend/env.example backend/.env
   ```
3. Never commit the `.env` file

### ✅ AWS Credentials Best Practices
- Use IAM roles when possible (recommended for production)
- Use temporary credentials for development
- Rotate access keys regularly
- Use least-privilege permissions
- Never share credentials in code, logs, or documentation

### ✅ Required AWS Permissions
Your AWS credentials need these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚨 If You Accidentally Commit Sensitive Data

1. **Immediately revoke/rotate the exposed credentials**
2. **Remove the sensitive data from git history**:
   ```bash
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/sensitive/file' \
   --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push to update remote**:
   ```bash
   git push origin --force --all
   ```
4. **Notify team members** to update their local repositories

## 📝 Development Workflow

1. Always use `env.example` as a template
2. Test with mock data when possible
3. Use separate AWS accounts for development
4. Regularly audit your git history for sensitive data
5. Use pre-commit hooks to scan for secrets (optional)

## 🔍 Security Tools (Optional)

Consider using these tools to prevent accidental commits:
- `git-secrets` - Prevents committing secrets
- `truffleHog` - Scans for secrets in git history
- `detect-secrets` - Detects secrets in code

## 📞 Support

If you have security concerns or questions, please:
1. Review this document
2. Check the `.gitignore` file
3. Contact the development team
