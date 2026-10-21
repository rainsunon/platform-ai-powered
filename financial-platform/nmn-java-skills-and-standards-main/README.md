# java-springboot-standards

> **NMN Java AI-SDLC Framework**
> Skills, rules, and agent definitions that AI coding agents use to generate
> consistent, production-quality Java Spring Boot code across all NMN projects.

Compatible with: **Claude Code · OpenAI Codex · Cursor · Kiro · Windsurf · Gemini CLI · Google Antigravity · GitHub Copilot**

---

## What Is This?

This repository is the shared engineering brain that every AI agent reads before touching your Java code.
It encodes NMN's Spring Boot conventions into structured skill files that agents load as context —
so every generated controller, entity, service, or test follows the same standards, automatically.

## Multi-Tool Setup

Every AI tool reads its own config file, but all reference the same `skills/` directory:

| Tool | Config file | Auto-loaded? |
|------|------------|:---:|
| Claude Code | `CLAUDE.md` | ✅ |
| OpenAI Codex | `AGENTS.md` | ✅ |
| Kiro | `.kiro/steering/*.md` + `AGENTS.md` | ✅ |
| Cursor | `.cursorrules` + `.cursor/rules/*.mdc` | ✅ |
| Gemini CLI | `GEMINI.md` | ✅ |
| Windsurf | `.windsurfrules` | ✅ |
| Google Antigravity | `.agents/skills/spring-boot-skill/SKILL.md` + `AGENTS.md` | ✅ |
| GitHub Copilot | `.github/copilot-instructions.md` | ✅ |

**Zero migration between tools** — open this repo in any supported tool and it works immediately.

See `docs/ai-tool-compatibility.md` for full details on each tool's architecture.

## Quick Setup

```bash
# Copy into your project root
cp -r skills ./skills
cp -r rules ./rules
cp -r agents ./agents
cp CLAUDE.md ./CLAUDE.md
cp AGENTS.md ./AGENTS.md
cp GEMINI.md ./GEMINI.md
cp .cursorrules ./.cursorrules
cp -r .cursor ./.cursor
cp .windsurfrules ./.windsurfrules
cp -r .kiro ./.kiro
cp -r .agents ./.agents
cp -r .github ./.github
```

Then tell the agent your framework in `CLAUDE.md` or your first prompt:

```
This project uses Spring Boot 3.x with PostgreSQL on Java 17.
java 17 in pom.xml.
Load skills/spring-boot/SKILL.md as the primary framework skill.
```

## Claude Code Slash Commands

| Command | Purpose |
|---|---|
| `/load-skill [framework]` | Load all common + framework skills |
| `/new-endpoint METHOD path "description"` | Scaffold a complete controller method with tests |
| `/review [file]` | Standards audit — returns ✅ / ⚠️ / ❌ |
| `/add-tests [file]` | Generate missing unit + integration tests |
| `/migrate "description"` | Create and apply a Flyway/Liquibase migration |

## File Guide

| Path | Load when |
|---|---|
| `CLAUDE.md` | Always — master agent contract |
| `skills/common/code-style.md` | Writing any Java |
| `skills/common/code-style-index.md` | Quick lookup — section map for code-style.md |
| `skills/common/folder-structure.md` | Starting a new module or project |
| `skills/common/error-handling.md` | Writing exception handlers or sentinel errors |
| `skills/common/logging.md` | Adding any logging (SLF4J / Logback) |
| `skills/common/security.md` | Auth, input validation, secrets |
| `skills/common/api-auth.md` | OAuth2, JWT, RBAC/ABAC, service-to-service auth |
| `skills/common/testing.md` | Writing tests (JUnit 5, Mockito, Testcontainers) |
| `skills/common/db-design.md` | Creating or modifying JPA entities / schema |
| `skills/common/data-migrations.md` | Zero-downtime Flyway migrations, backfills |
| `skills/common/performance.md` | Caching, N+1 prevention, connection pooling |
| `skills/common/llm-patterns.md` | LLM client abstraction, prompt management |
| `skills/common/ci-cd.md` | GitHub Actions pipelines, Maven lifecycle |
| `skills/common/deployment.md` | Docker, health checks, 12-factor |
| `skills/common/observability.md` | Micrometer, Actuator, OpenTelemetry, Zipkin |
| `skills/common/concurrency-patterns.md` | CompletableFuture, virtual threads, @Async |
| `skills/common/microservices.md` | Service boundaries, Feign clients, inter-service comms |
| `skills/common/feature-flags.md` | Gradual rollouts, flag lifecycle |
| `skills/common/dependency-management.md` | Maven BOMs, dependency versions, vulnerability scanning |
| `skills/spring-boot/SKILL.md` | Spring Boot MVC projects |
| `skills/spring-webflux/SKILL.md` | Reactive / WebFlux projects |
| `skills/grpc/SKILL.md` | gRPC service projects |
| `skills/kafka/SKILL.md` | Kafka producer/consumer projects |
| `rules/api-design.md` | Designing or reviewing REST API endpoints |
| `rules/git-workflow.md` | Branching, commits, PRs, releases, rollback |
| `rules/code-review.md` | Reviewing code — checklist, severity, feedback |
| `agents/qa-agent.md` | Automated QA pipeline setup |
| `docs/onboarding.md` | New developer onboarding |
| `docs/incident-response.md` | On-call, severity, postmortems |
| `docs/tech-debt.md` | Tracking and prioritizing tech debt |
| `docs/adr/ADR-template.md` | Architecture decision records |
| `examples/spring-boot-app/` | Reference implementation |

## Contributing

When you discover a new best practice or fix a gap:

1. Update the relevant skill file.
2. Open a PR with a clear description of what changed and why.
3. Tag it `skills-update`.
4. Post to the team Slack channel — other projects need to pull the update.

Review and update skill files during each sprint retrospective.

---