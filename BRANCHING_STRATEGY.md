# FinTrax Branching Strategy

## 🌳 Branch Structure

```
main (production)
├── develop (staging/integration)
├── feature/frontend-improvements
├── feature/transaction-service-updates
├── feature/account-service-enhancements
├── feature/category-service-features
├── feature/api-gateway-security
├── hotfix/critical-bug-fixes
└── release/v1.0.0
```

## 🚀 Environment Mapping

| Branch | Environment | ECR Public Repo | Auto Deploy |
|--------|-------------|-----------------|-------------|
| `main` | production | `public.ecr.aws/fintrax/prod-*` | ✅ |
| `develop` | staging | `public.ecr.aws/fintrax/staging-*` | ✅ |
| `feature/*` | development | `public.ecr.aws/fintrax/dev-*` | Manual |
| `hotfix/*` | hotfix | `public.ecr.aws/fintrax/hotfix-*` | Manual |

## 📋 Workflow Rules

### Development Flow:
1. Create feature branch from `develop`
2. Develop feature
3. Create PR to `develop`
4. Code review required
5. Merge to `develop` (triggers staging deployment)
6. Test in staging
7. Create PR from `develop` to `main`
8. Final review and merge to `main` (triggers production deployment)

### Hotfix Flow:
1. Create hotfix branch from `main`
2. Fix critical issue
3. Create PR to `main`
4. Emergency review and merge
5. Merge back to `develop`

## 🔄 Deployment Strategy

- **Development**: Manual trigger, dev environment
- **Staging**: Auto deploy on `develop` branch
- **Production**: Auto deploy on `main` branch
- **Hotfix**: Manual trigger, immediate deployment
