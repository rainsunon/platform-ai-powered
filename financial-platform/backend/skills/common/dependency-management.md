# Dependency Management — Enterprise Standard

**Applies to:** All Java Spring Boot projects.
**Tools:** Maven, OWASP Dependency-Check, Dependabot / Renovate, Maven Enforcer, Maven Versions Plugin.

---

## SECTION 1 — pom.xml DISCIPLINE

```xml
<!-- pom.xml — root structure -->
<project>
  <groupId>com.nmn</groupId>
  <artifactId>my-service</artifactId>
  <version>1.0.0</version>
  <packaging>jar</packaging>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.4</version>   <!-- pin to exact minor — never RELEASE or LATEST -->
  </parent>

  <properties>
    <java.version>17</java.version>
    <mapstruct.version>1.5.5.Final</mapstruct.version>
    <testcontainers.version>1.20.1</testcontainers.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <!-- Centralise version for all OTel artifacts -->
      <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-bom</artifactId>
        <version>1.38.0</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <dependencies>
    <!-- Declare dependencies without versions when covered by Spring Boot BOM -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <!-- Declare explicit version only when overriding the BOM -->
    <dependency>
      <groupId>org.mapstruct</groupId>
      <artifactId>mapstruct</artifactId>
      <version>${mapstruct.version}</version>
    </dependency>
  </dependencies>
</project>
```

### Rules

| Rule | Rationale |
|---|---|
| Always commit `pom.xml` | Reproducible builds — source of truth for all versions |
| Pin `spring-boot-starter-parent` to an exact minor version | Toolchain consistency across machines and CI |
| Declare versions in `<properties>` or `<dependencyManagement>` — never inline in `<dependency>` | Single place to update; avoids version drift |
| Use Spring Boot BOM for managed dependencies — omit `<version>` tags | BOM guarantees compatibility across the Spring ecosystem |
| Run `mvn dependency:analyze` before every release | Detects unused declared deps and undeclared used deps |
| Never use `LATEST` or `RELEASE` version specifiers | Non-reproducible — breaks in CI at any time |
| Use `<dependencyManagement>` for BOMs and cross-module version alignment | Prevents version conflicts in multi-module projects |
| Major version upgrades require an ADR | Breaking-change planning |

---

## SECTION 2 — VULNERABILITY SCANNING

### OWASP Dependency-Check (primary)

```xml
<!-- pom.xml -->
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>9.2.0</version>
  <configuration>
    <failBuildOnCVSS>7</failBuildOnCVSS>       <!-- fail on HIGH or CRITICAL -->
    <suppressionFile>owasp-suppressions.xml</suppressionFile>
    <formats>
      <format>HTML</format>
      <format>JSON</format>
    </formats>
  </configuration>
  <executions>
    <execution>
      <goals><goal>check</goal></goals>
    </execution>
  </executions>
</plugin>
```

```bash
# Run manually
mvn org.owasp:dependency-check-maven:check

# CI — fail build on HIGH/CRITICAL CVEs
mvn verify -Ddependency-check.failBuildOnCVSS=7
```

### Tools

| Tool | Purpose |
|------|---------|
| OWASP Dependency-Check | CVE scanning against NVD database |
| Dependabot (GitHub native) | Auto-create PRs for vulnerable deps |
| Renovate | More configurable alternative to Dependabot |
| Snyk | Enterprise SCA with license compliance |
| JFrog Xray | Artifact-level scanning in Nexus/Artifactory |
| Maven Enforcer | Enforce banned dependencies and version ranges |

### Response SLA

| Severity | Action | Timeline |
|----------|--------|----------|
| Critical (CVSS ≥ 9.0) | Patch immediately, deploy same day | < 24 hours |
| High (CVSS 7.0–8.9) | Patch within sprint | < 1 week |
| Medium (CVSS 4.0–6.9) | Schedule next sprint | < 2 weeks |
| Low (CVSS < 4.0) | Bundle with next regular update | < 1 month |

---

## SECTION 3 — UPDATE CADENCE

| Activity | Frequency |
|----------|-----------|
| Security patches (critical/high) | Immediately |
| Patch version bumps | Weekly (auto via Renovate) |
| Minor version bumps | Monthly (auto via Renovate, manual review) |
| Major version upgrades | Quarterly (planned, with ADR) |
| Full dependency audit (`dependency:analyze`) | Monthly |
| Spring Boot parent version bump | When new minor is GA + ~1 month for ecosystem stabilisation |

### Renovate Configuration

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "schedule": ["before 9am on Monday"],
  "packageRules": [
    {
      "matchManagers": ["maven"],
      "matchUpdateTypes": ["patch"],
      "automerge": true
    },
    {
      "matchManagers": ["maven"],
      "matchUpdateTypes": ["minor"],
      "automerge": false,
      "labels": ["dependencies"]
    },
    {
      "matchManagers": ["maven"],
      "matchUpdateTypes": ["major"],
      "labels": ["dependencies", "breaking"],
      "reviewers": ["team:leads"]
    },
    {
      "matchPackagePatterns": ["io.opentelemetry.*"],
      "groupName": "opentelemetry"
    },
    {
      "matchPackagePrefixes": ["org.springframework"],
      "groupName": "spring-framework"
    }
  ]
}
```

---

## SECTION 4 — MAJOR VERSION HANDLING

Java ecosystem major version bumps often involve namespace changes (e.g. `javax.*` → `jakarta.*` in Spring Boot 3).

```bash
# Check for available major version upgrades
mvn versions:display-dependency-updates

# Display available plugin upgrades
mvn versions:display-plugin-updates

# Update all dependencies to latest (use with caution — review diff before committing)
mvn versions:use-latest-releases
```

**Multi-module projects** — manage versions centrally in the root `pom.xml`:

```xml
<!-- Root pom.xml -->
<properties>
  <spring-boot.version>3.4.4</spring-boot.version>
  <postgresql.version>42.7.3</postgresql.version>
</properties>

<!-- Child modules reference parent properties — never hardcode versions in child poms -->
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <version>${postgresql.version}</version>
</dependency>
```

**Rule:** never upgrade across a major in a routine dep-bump PR. It is a planned change with an ADR.

---

## SECTION 5 — PRIVATE & INTERNAL MODULES

For internal Maven artifacts published to Nexus or Artifactory:

```xml
<!-- pom.xml — internal repository -->
<repositories>
  <repository>
    <id>nmn-internal</id>
    <url>https://nexus.nmn.com/repository/maven-releases/</url>
    <releases><enabled>true</enabled></releases>
    <snapshots><enabled>false</enabled></snapshots>  <!-- never use SNAPSHOTs in production -->
  </repository>
</repositories>
```

```xml
<!-- ~/.m2/settings.xml — credentials (never commit) -->
<servers>
  <server>
    <id>nmn-internal</id>
    <username>${env.NEXUS_USERNAME}</username>
    <password>${env.NEXUS_PASSWORD}</password>
  </server>
</servers>
```

Rules:
- Internal libraries follow semver and are tagged as releases — never deploy `SNAPSHOT` versions to production.
- Pin internal dependencies to exact versions in consuming services.
- CI authenticates to Nexus via env vars (`NEXUS_USERNAME`, `NEXUS_PASSWORD`) injected from secrets manager.
- Publish internal libraries via CI/CD pipeline — never `mvn deploy` from a developer machine.

---

## SECTION 6 — DEPENDENCY LOCKING

Maven resolves dependencies at build time. For fully reproducible offline builds:

```xml
<!-- pom.xml — Maven Dependency Plugin: download all deps to a local cache -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-dependency-plugin</artifactId>
  <executions>
    <execution>
      <id>go-offline</id>
      <goals><goal>go-offline</goal></goals>
    </execution>
  </executions>
</plugin>
```

```bash
# Pre-download all dependencies (air-gapped / offline builds)
mvn dependency:go-offline

# Build using only local cache — no network calls
mvn -o package
```

Most teams should **not** need offline mode — Maven's local `~/.m2` cache combined with a Nexus/Artifactory proxy already guarantees reproducibility without checking in JARs.

---

## SECTION 7 — MAVEN ENFORCER (compile-time dependency rules)

Use Maven Enforcer to enforce dependency hygiene at build time:

```xml
<!-- pom.xml -->
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-enforcer-plugin</artifactId>
  <executions>
    <execution>
      <id>enforce</id>
      <goals><goal>enforce</goal></goals>
      <configuration>
        <rules>
          <!-- Minimum Java and Maven versions -->
          <requireJavaVersion>
            <version>[17,)</version>
          </requireJavaVersion>
          <requireMavenVersion>
            <version>[3.9,)</version>
          </requireMavenVersion>

          <!-- No duplicate dep declarations with different versions -->
          <banDuplicatePomDependencyVersions/>

          <!-- No SNAPSHOT versions in non-snapshot builds -->
          <requireReleaseDeps>
            <onlyWhenRelease>true</onlyWhenRelease>
            <message>No SNAPSHOT dependencies allowed in release builds.</message>
          </requireReleaseDeps>

          <!-- Ban known insecure or replaced libraries -->
          <bannedDependencies>
            <excludes>
              <exclude>log4j:log4j</exclude>                  <!-- Log4Shell CVE-2021-44228 -->
              <exclude>commons-collections:commons-collections:[,3.2.2)</exclude>
              <exclude>org.springframework.boot:spring-boot-starter-log4j2</exclude>
            </excludes>
          </bannedDependencies>
        </rules>
        <fail>true</fail>
      </configuration>
    </execution>
  </executions>
</plugin>
```

---

## SECTION 8 — DEPENDENCY HYGIENE

| Practice | Rationale |
|---|---|
| Prefer Spring Boot starters | Curated, compatible, managed by the BOM |
| Prefer well-maintained libraries (>500 stars, recent commits, active maintainer) | Reduce supply-chain risk |
| Verify artifact coordinates carefully | Typosquatting is real (`sprng-boot` vs `spring-boot`) |
| Minimise dependency count | Each dep is an attack surface and maintenance burden |
| Review transitive deps periodically | Use `mvn dependency:tree` — watch for unexpected additions |
| Never use `compile` scope for test-only deps | Use `test` scope; keeps production JAR lean |
| Prefer `implementation` over `api` in Gradle (if used) | Avoids leaking transitive deps to consumers |

```bash
# List direct dependencies
mvn dependency:list -DincludeScope=compile -DexcludeTransitive=true

# Find what brings in a specific artifact
mvn dependency:tree -Dincludes=com.example:some-lib

# Total dependency count (all scopes)
mvn dependency:tree | grep "+- " | wc -l

# Check for unused declared + undeclared used deps
mvn dependency:analyze
```

---

## SECTION 9 — RULES SUMMARY

| Rule | Rationale |
|------|-----------|
| Always commit `pom.xml` with pinned versions | Reproducible builds |
| Run OWASP Dependency-Check in CI | Catch CVEs before deploy |
| Run `mvn dependency:analyze` before releases | Detect unused and missing deps |
| Use Spring Boot BOM — omit `<version>` for managed deps | Guaranteed compatibility |
| Use `<dependencyManagement>` for non-BOM version alignment | Single source of truth for versions |
| Never use `LATEST`, `RELEASE`, or `SNAPSHOT` in production | Non-reproducible; breaks at any time |
| Review major upgrades as a team with an ADR | Breaking changes need planning |
| Prefer well-maintained packages | Reduce supply-chain risk |
| Verify artifact coordinates | Typosquatting defence |
| Minimise dependency count | Reduce attack surface |
| Use Maven Enforcer to ban insecure libraries | Compile-time safety net |
