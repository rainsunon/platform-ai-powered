# Git Workflow Standards

**Applies to:** All Java Spring Boot projects.

---

## Branch Naming

```
feature/{ticket-id}-short-description     ← New features
fix/{ticket-id}-short-description         ← Bug fixes
chore/{ticket-id}-short-description       ← Non-functional changes
hotfix/{ticket-id}-short-description      ← Production emergency fixes
release/v{major}.{minor}.{patch}          ← Release preparation
```

---

## Commit Message Format (Conventional Commits)

```
{type}({scope}): {short description}

{optional body}

{optional footer: BREAKING CHANGE or issue reference}
```

Types: `feat` `fix` `chore` `docs` `test` `refactor` `perf` `ci`

Examples:
```
feat(users): add email verification on registration
fix(auth): prevent token reuse after logout
test(orders): add integration tests for checkout flow
perf(queries): add composite index for user search
chore(deps): upgrade spring-boot to 3.3.0
```

---

## PR Rules

- Every PR must reference a ticket.
- PRs must pass: `google-java-format`, `checkstyle`, `spotbugs`, `pmd`, `dependency-check`, `mvn test`, ≥80% JaCoCo instruction coverage.
- Minimum 1 peer review required before merge.
- Squash merge to keep main history clean.
- Delete branch after merge.
- PR title follows conventional commit format: `feat(scope): description`.
- PR description must include: what changed, why, how to test.
- Never merge a PR with unresolved review threads.
- Never merge if Flyway migrations are present without a DBA or senior review.

---

## Protected Branches

| Branch | Purpose | Push | Merge via | Requirements |
|--------|---------|------|-----------|--------------|
| `main` | Production | ❌ Direct push blocked | PR only | CI green + 1 review + no unresolved threads |
| `develop` | Integration | ❌ Direct push blocked | PR only | CI green |
| `release/*` | Release prep | ❌ | PR to main | QA sign-off + CI green |

---

## Release Strategy (Semantic Versioning)

Format: `v{MAJOR}.{MINOR}.{PATCH}`

| Increment | When |
|-----------|------|
| MAJOR | Breaking API changes, incompatible schema migrations, removal of deprecated endpoints |
| MINOR | New features, new endpoints, backward-compatible additions |
| PATCH | Bug fixes, security patches, dependency updates — no new features |

### Release Flow

```
1. develop accumulates features via PRs
2. Cut release branch: release/v1.2.0
3. Only bug fixes allowed on release branch
4. QA validates on staging
5. Merge release → main (PR, squash)
6. Tag: git tag v1.2.0
7. Merge main → develop (sync back)
8. CI auto-deploys tagged commit to production
```

### Tagging

```bash
git tag -a v1.2.0 -m "Release v1.2.0: user verification, performance improvements"
git push origin v1.2.0
```

Tags trigger the release pipeline — see `skills/common/ci-cd.md §7`.

### Maven version stamping

```bash
# Set pom.xml version to match the release tag before tagging
mvn versions:set -DnewVersion=1.2.0 --no-transfer-progress
git add pom.xml
git commit -m "chore(release): bump version to 1.2.0"
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags
```

---

## Environment Promotion

```
develop → staging → production
```

| Environment | Branch / Tag | Deploy trigger | Purpose |
|-------------|-------------|----------------|---------|
| Development | `develop` | Auto on merge | Integration testing |
| Staging | `release/*` | Auto on push | QA validation, pre-prod mirror |
| Production | `main` (tagged) | Tag push `v*` | Live traffic |

### Rules

- Same Docker image promoted across environments — only env vars change.
- Staging must mirror production infrastructure (same Postgres major, same Redis version, same JVM version).
- Feature flags for incomplete features merged to develop — see `skills/common/feature-flags.md`.
- No environment-specific code paths — use `@Profile` or configuration only.
- Flyway migrations run automatically on startup — staging validates them before production.

---

## Hotfix Flow

For critical production bugs that cannot wait for the next release:

```
1. Branch from main: hotfix/TICKET-123-fix-auth-bypass
2. Fix + test (must include regression test)
3. PR to main — expedited review (1 reviewer, senior)
4. Tag: v1.2.1
5. Merge main → develop (sync the fix back)
```

Hotfixes skip staging only when:
- P0/P1 severity (data loss, security breach, full outage)
- Fix is isolated and well-tested
- On-call engineer approves
- No Flyway migrations involved (migrations always need staging validation)

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# Redeploy previous known-good tag via CI
# Or manually: pull and redeploy the previous Docker image tag
docker pull ghcr.io/nmn/myservice:v1.1.0
# Update Kubernetes deployment to point to v1.1.0 image
kubectl set image deployment/myservice myservice=ghcr.io/nmn/myservice:v1.1.0
```

### Database Rollback (Flyway)

- If the release included migrations: check if they are reversible.
- Flyway Community does not support `down` migrations — use the undo approach:

```bash
# Option 1 — Flyway Teams: run undo migration
mvn flyway:undo -Dflyway.url=${DATABASE_URL}

# Option 2 — Manual: write a new forward migration that reverses the change
# V5__revert_add_order_status_column.sql
ALTER TABLE orders DROP COLUMN IF EXISTS status;
```

- **Rule:** every destructive migration (DROP COLUMN, DROP TABLE) must have a
  corresponding undo migration script committed alongside it.
- If a data migration is irreversible, use expand-contract pattern instead —
  see `skills/common/data-migrations.md`.

### Rollback Decision Matrix

| Scenario | Action |
|----------|--------|
| App crash on startup (JVM, bean wiring) | Redeploy previous image tag immediately |
| Error rate > 5% after deploy | Rollback, investigate |
| Slow degradation (p99 creeping up) | Monitor 10 min, rollback if worsening |
| Single user report | Investigate first, don't rollback |
| Data corruption | Rollback + restore from backup |
| OOM / memory leak | Rollback + increase heap via `-XX:MaxRAMPercentage` if urgent |

### Post-Rollback

1. Create incident ticket.
2. Write postmortem within 48 hours — see `docs/incident-response.md`.
3. Fix must include regression test before re-release.
4. If a Flyway migration was rolled back, increment the version number — never reuse a migration version.

---

## Changelog

Maintain `CHANGELOG.md` using [Keep a Changelog](https://keepachangelog.com/) format.
Every PR that changes user-facing behaviour must update the changelog under `[Unreleased]`.

```markdown
## [Unreleased]

### Added
- POST /api/v1/orders endpoint for order creation

### Changed
- GET /api/v1/users now requires VIEWER role (previously public)

### Fixed
- Fixed NPE in OrderServiceImpl when items list is empty

### Security
- Upgraded spring-boot to 3.3.1 to patch CVE-2024-XXXX
```
