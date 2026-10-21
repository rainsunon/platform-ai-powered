# Java Spring Boot AI-SDLC Framework — Developer Onboarding

## What Is This?

This repository is the **Java Spring Boot AI-SDLC skill set** — a set of rules, standards, and skill files that AI coding agents (Claude Code, Cursor, Kiro, Gemini, etc.) use to generate consistent, production-quality Java code across all NMN Java projects.

Think of it as a shared engineering brain that every agent reads before touching your code.

---

## Quick Setup for a New Project

### Step 1 — Copy skill files into your project

```bash
# From your project root
git clone https://github.com/nmn/java-ai-sdlc skills-ref

cp -r skills-ref/skills ./skills
cp -r skills-ref/rules ./rules
cp -r skills-ref/agents ./agents
cp skills-ref/CLAUDE.md ./CLAUDE.md
cp skills-ref/AGENTS.md ./AGENTS.md
cp skills-ref/GEMINI.md ./GEMINI.md
cp skills-ref/.cursorrules ./.cursorrules
cp -r skills-ref/.cursor ./.cursor
cp skills-ref/.windsurfrules ./.windsurfrules
cp -r skills-ref/.kiro ./.kiro
cp -r skills-ref/.agents ./.agents
cp -r skills-ref/.github ./.github
```

### Step 2 — Tell the agent your framework

Add to the top of your `CLAUDE.md` (or first message):

```
This project uses Spring Boot 3.x with PostgreSQL and Redis on Java 17.
Maven is the build tool.
Load skills/spring-boot/SKILL.md as the primary framework skill.
```

### Step 3 — Start coding

For Claude Code:
```bash
claude code
# Then use /load-skill spring-boot to prime the agent
```

For Cursor: `.cursorrules` is auto-loaded.

For Kiro: point at `CLAUDE.md` as the project spec.

---

## File Guide

| File | Read When |
|---|---|
| `CLAUDE.md` | Always — master context |
| `skills/common/code-style.md` | Writing any Java |
| `skills/common/folder-structure.md` | Starting a new project or module |
| `skills/common/logging.md` | Adding any logging |
| `skills/common/error-handling.md` | Writing or mapping exceptions |
| `skills/common/security.md` | Anything touching auth, input, secrets |
| `skills/common/testing.md` | Writing tests |
| `skills/common/db-design.md` | Creating or modifying JPA entities |
| `skills/common/concurrency-patterns.md` | Threads, async tasks, CompletableFuture |
| `skills/common/data-migrations.md` | Creating or modifying Flyway migrations |
| `skills/common/observability.md` | Metrics, tracing, Spring Actuator |
| `skills/common/performance.md` | Caching, pagination, N+1 prevention |
| `skills/spring-boot/SKILL.md` | Spring MVC REST API projects |
| `skills/spring-webflux/SKILL.md` | Reactive / WebFlux projects |
| `skills/kafka/SKILL.md` | Kafka producer / consumer services |
| `skills/grpc/SKILL.md` | gRPC microservice projects |
| `rules/api-design.md` | Designing or reviewing REST endpoints |
| `rules/git-workflow.md` | Branching, commits, PRs, releases |
| `rules/code-review.md` | Review checklist and severity levels |
| `agents/qa-agent.md` | Setting up automated QA in pipeline |

---

## Keeping Skills Updated

This framework is a living document. When you discover a new best practice or fix a gap:

1. Update the relevant skill file.
2. Create a PR with a clear description of what changed and why.
3. Tag it `skills-update`.
4. Notify the team on Slack — other project teams need to pull the update.

**Cadence:** review and update skill files during each sprint retrospective.

---

## First PR Workflow (Target: Day 2)

### Day 1 — Setup & Context

1. Clone the project repo and run the setup script.
2. Read `CLAUDE.md` and `skills/common/folder-structure.md` to understand the architecture.
3. Start local dependencies:
   ```bash
   docker-compose up -d   # starts Postgres, Redis
   ```
4. Run the test suite locally — ensure everything passes:
   ```bash
   mvn test
   ```
5. Read the last 5 merged PRs to understand team conventions.
6. Pick a starter ticket (labelled `good-first-issue` or assigned by your buddy).

### Day 2 — First PR

1. Create a feature branch: `feature/TICKET-123-short-description`
2. Implement the change following the skill files.
3. Generate code in this order (from `folder-structure.md` §3):
   - Entity → DTO → Repository → Mapper → Service interface → ServiceImpl → Controller → Tests
4. Write tests — minimum: happy path + one edge case + one error path.
5. Run locally before pushing:
   ```bash
   mvn spotless:check          # google-java-format
   mvn checkstyle:check        # style rules
   mvn test                    # unit tests
   mvn verify                  # integration tests + JaCoCo coverage gate
   mvn dependency-check:check  # OWASP vulnerability scan
   ```
6. Self-review your diff before pushing.
7. Open PR with description: what, why, how to test.
8. Request review from your assigned buddy.

### First Week Checklist

- [ ] Local dev environment running (Docker, Postgres, Redis)
- [ ] First PR merged
- [ ] Attended one standup
- [ ] Read `rules/code-review.md` — understand review expectations
- [ ] Read `docs/incident-response.md` — know the escalation path
- [ ] Access to: Slack channels, Jira/Linear, CI dashboard, monitoring (Spring Actuator, Grafana)

---

## Mentoring Structure

### Buddy System

Every new developer is assigned a **buddy** (senior dev on the same team):

| Buddy responsibility | Timeline |
|---------------------|----------|
| Pair on first PR | Day 1-2 |
| Review all PRs for first 2 weeks | Week 1-2 |
| Daily 15-min check-in | Week 1-2 |
| Weekly 30-min check-in | Week 3-4 |
| Available for questions async | Ongoing |

### What the Buddy Does NOT Do

- Performance evaluation
- Task assignment
- Escalation decisions

---

## Ramp-Up Expectations

| Timeframe | Expected capability |
|-----------|-------------------|
| **Week 1** | Environment setup, first PR merged, understands project layer structure |
| **Week 2** | Handles small bug fixes independently, writes parameterised JUnit 5 tests |
| **Week 4** | Delivers small features end-to-end (controller + service + repository + tests) |
| **Week 6** | Participates in code reviews, handles medium features with Flyway migrations |
| **Week 8** | Fully autonomous on standard tasks, starts reviewing others' PRs |
| **Month 3** | Contributes to architectural discussions, mentors newer joiners |

### Signs of Healthy Ramp-Up

- Asking questions (not staying stuck silently)
- PRs getting smaller over time (learning to scope)
- Fewer review comments per PR over time
- Starting to catch issues in others' code reviews

### Signs of Trouble (Lead should intervene)

- No PR by end of Day 3
- Same review feedback repeated across multiple PRs
- Not asking questions
- Scope creep on tickets

---

## Key Resources for New Developers

| Resource | Purpose |
|----------|---------|
| `CLAUDE.md` | Master contract — read first |
| `skills/common/code-style.md` | How we write Java |
| `rules/code-review.md` | How we review code |
| `rules/git-workflow.md` | Branching, commits, PRs |
| `docs/adr/` | Why past decisions were made |
| `examples/spring-boot-app/` | Reference implementation |
| `docs/incident-response.md` | What to do when things break |

---

## Contact

Java SDLC framework owner: **Arpit Gaur**
Team: NMN Engineering Platform
