# Code Style — Section Index

> `code-style.md` is large. Agents should load only the sections relevant to the current task.
> Use this index to determine which sections to reference.

---

## Quick Reference — Load by Task

| Task | Load sections |
|------|---------------|
| Writing any Java | §1 Toolchain, §2 Code Layout |
| Organising imports | §3 Imports |
| Writing Javadoc comments | §8 Comments & Javadoc |
| Naming things | §9 Naming Conventions |
| Adding generics / interfaces | §11 Type & Interface Design |
| Errors & exceptions | §12.4 Exception Handling, see also `error-handling.md` |
| Concurrency | §12.9–§12.11, see also `concurrency-patterns.md` |
| Code review | §12 Programming Recommendations, §13 Anti-Patterns |
| Setting up tooling | §15 Toolchain Configuration |
| Version compatibility | §14 Version Compatibility Matrix |

---

## Section Map

| Section | Content |
|---------|---------|
| Prime Directive | Priority rules for when to deviate from this standard |
| §1 Toolchain | google-java-format, Checkstyle, SpotBugs, OWASP dependency-check |
| §2 Code Layout | Indentation (4 spaces), blank lines, class/record/enum formatting |
| §3 Imports | Static imports, wildcard rules, IDE import order, forbidden imports |
| §4 Package & File | Package names, file names, module structure, `module-info.java` |
| §5 String Literals | Text blocks (`"""`), `String.format` vs `formatted()`, `StringBuilder` |
| §6 Whitespace | Checkstyle pet peeves, annotation placement, lambda formatting |
| §7 Trailing Commas | Multi-line method args, annotation arrays, record components |
| §8 Comments | Javadoc — starts with verb; `{@code}`, `{@link}`; TODO format; `@SuppressWarnings` specificity |
| §9 Naming | Package, class, method, field, constant, type parameter, record component naming |
| §10 Defaults & Optionals | Use `Optional` for nullable returns; constructor vs factory methods; default field values |
| §11 Type & Interface | Program to interfaces; small interfaces; generics; sealed classes; records vs classes |
| §12 Programming Recs | Exceptions, try-with-resources, streams, collections, concurrency, switch expressions |
| §13 Anti-Patterns | Production-incident-grade mistakes |
| §14 Version Matrix | Feature availability across Java 11 / 17 / 21 (LTS) |
| §15 Toolchain Config | `checkstyle.xml`, `.editorconfig`, Maven Enforcer, pre-commit hooks, `pom.xml` discipline |
| Appendix | Violations quick reference (CRITICAL / ERROR / WARNING) |

---

## Usage

Agents should load the full `code-style.md` only when performing a comprehensive code review.
For targeted tasks, reference the relevant section by name.
