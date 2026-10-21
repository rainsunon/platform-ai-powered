# AI Tool Compatibility Reference

> How this repository works with every major AI coding tool.
> All tools reference the same `skills/` and `rules/` directories — no content duplication.

---

## Architecture: Single Source of Truth

```
skills/common/*.md               ← Canonical standards
skills/{framework}/SKILL.md      ← Framework-specific skills (spring-boot / spring-webflux / kafka / grpc)
rules/*.md                       ← Process rules
        │
        ├── CLAUDE.md                       → Claude Code
        ├── AGENTS.md                       → Codex / Kiro / Antigravity
        ├── GEMINI.md                       → Gemini CLI
        ├── .cursorrules                    → Cursor (legacy)
        ├── .cursor/rules/*.mdc             → Cursor (modern MDC)
        ├── .windsurfrules                  → Windsurf
        ├── .kiro/steering/*.md             → Kiro (steering)
        ├── .github/copilot-instructions.md → GitHub Copilot
        └── .agents/skills/*/SKILL.md       → Google Antigravity
```

**Key principle:** each tool-specific file is a thin "loader" that points to the canonical `skills/` directory. If you update a skill, ALL tools get the update automatically.

---

## Tool-by-Tool Reference

### 1. Claude Code

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Master agent contract — loaded automatically |

Claude Code reads `CLAUDE.md` at project root before every task. It contains the full file structure map, non-negotiable rules, and instructions to load skill files.

---

### 2. OpenAI Codex CLI

| File | Purpose |
|------|---------|
| `AGENTS.md` | Project instructions — auto-loaded |

Codex reads `AGENTS.md` at project root. Supports subdirectory `AGENTS.md` files for module-specific overrides. This is an open standard shared with Kiro and Antigravity.

---

### 3. Kiro

| File | Purpose |
|------|---------|
| `.kiro/steering/product.md` | Product context |
| `.kiro/steering/tech.md` | Technology stack |
| `.kiro/steering/structure.md` | Project structure |
| `AGENTS.md` | Also auto-loaded by Kiro |

Kiro loads all `.kiro/steering/*.md` files automatically in every chat session. It also supports `AGENTS.md` as an additional context source.

---

### 4. Cursor

| File | Purpose |
|------|---------|
| `.cursorrules` | Legacy rules (auto-loaded, all files) |
| `.cursor/rules/java-core.mdc` | Core Java rules (always active) |
| `.cursor/rules/java-testing.mdc` | Testing rules (auto-attach to `*Test.java`, `*IT.java`) |
| `.cursor/rules/java-security.mdc` | Security rules (always active) |

Cursor ≥0.45 uses `.cursor/rules/*.mdc` files with glob-based auto-attachment. The `.cursorrules` root file is kept for backward compatibility.

**MDC format:**
```
---
description: Rule description
globs: "**/*.java"
alwaysApply: true
---
# Rule content in markdown
```

---

### 5. Gemini CLI

| File | Purpose |
|------|---------|
| `GEMINI.md` | Project context — auto-loaded |

Gemini CLI reads `GEMINI.md` at project root. Also supports `~/.gemini/GEMINI.md` for global user-level instructions. Project-level takes precedence.

---

### 6. Windsurf

| File | Purpose |
|------|---------|
| `.windsurfrules` | Workspace rules — auto-loaded by Cascade |

Windsurf reads `.windsurfrules` at workspace root. Rules are included in every Cascade interaction.

---

### 7. Google Antigravity

| File | Purpose |
|------|---------|
| `.agents/skills/spring-boot-skill/SKILL.md` | Main skill definition |
| `.agents/workflows/new-endpoint.md` | Endpoint scaffolding workflow |
| `AGENTS.md` | Also auto-loaded |

Antigravity reads `.agents/skills/*/SKILL.md` files with YAML frontmatter. Skills are reusable capability packages.

---

### 8. GitHub Copilot

| File | Purpose |
|------|---------|
| `.github/copilot-instructions.md` | Repository custom instructions |

Copilot reads `.github/copilot-instructions.md` and injects it as context. Works in VS Code, JetBrains, and GitHub.com.

---

## Switching Between Tools

Because all tool-specific files reference the same `skills/` directory:

1. **Switching tools requires zero migration** — open the repo in the new tool.
2. **Updating a skill updates all tools** — edit `skills/common/testing.md` and every tool sees the change.
3. **No content drift** — there's only one source of truth per topic.

---

## Adding a New AI Tool

1. Research what context file it reads.
2. Create the file in the appropriate location.
3. Make it a thin loader that references `skills/` — never duplicate content.
4. Add it to this doc.
5. Update `.gitignore` if the tool generates cache files.
