# CI/CD — Enterprise Standard

**Applies to:** All Spring Boot projects using GitHub Actions (adapt for GitLab CI / Azure Pipelines).
**Pipeline philosophy:** Fail fast, fail cheap. Lint before test, test before build, build before deploy.

---

## SECTION 1 — PIPELINE STAGES

```
lint → vuln → test → build → deploy
```

Each stage gates the next. If lint fails, nothing else runs.

---

## SECTION 2 — GITHUB ACTIONS TEMPLATE

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  JAVA_VERSION: "17"
  JAVA_DISTRIBUTION: "temurin"

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: ${{ env.JAVA_DISTRIBUTION }}
          cache: maven

      - name: Checkstyle
        run: mvn checkstyle:check --no-transfer-progress

      - name: SpotBugs
        run: mvn spotbugs:check --no-transfer-progress

      - name: PMD
        run: mvn pmd:check --no-transfer-progress

  vuln:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: ${{ env.JAVA_DISTRIBUTION }}
          cache: maven

      - name: OWASP Dependency Check
        run: mvn dependency-check:check --no-transfer-progress
        env:
          NVD_API_KEY: ${{ secrets.NVD_API_KEY }}   # speeds up NVD feed download

      - name: Upload OWASP report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: owasp-report
          path: target/dependency-check-report.html

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ["6379:6379"]
    env:
      DATABASE_URL: jdbc:postgresql://localhost:5432/test_db
      DATABASE_USERNAME: test
      DATABASE_PASSWORD: test
      REDIS_URL: redis://localhost:6379/0
      JWT_SECRET: test-secret-key-minimum-32-characters-long
      SPRING_PROFILES_ACTIVE: test
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: ${{ env.JAVA_DISTRIBUTION }}
          cache: maven

      - name: Unit tests
        run: mvn test --no-transfer-progress

      - name: Integration tests
        run: mvn verify -P integration-tests --no-transfer-progress

      - name: Coverage gate (80% minimum)
        run: |
          mvn jacoco:report --no-transfer-progress
          mvn jacoco:check --no-transfer-progress

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jacoco-report
          path: target/site/jacoco/

  build:
    runs-on: ubuntu-latest
    needs: [test, vuln]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: ${{ env.JAVA_DISTRIBUTION }}
          cache: maven

      - name: Build fat JAR (skip tests — already ran)
        run: mvn package -DskipTests --no-transfer-progress

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true
```

---

## SECTION 3 — RULES

| Rule | Rationale |
|------|-----------|
| Pin all action versions to a major version (`@v4`, `@v5`) | Prevent supply-chain attacks |
| Use `concurrency` to cancel stale runs | Save CI minutes |
| Cache Maven deps (`setup-java` `cache: maven`) | Speed up pipelines |
| Never store secrets in workflow files — use GitHub Secrets / OIDC | Security |
| Run DB-dependent tests with service containers (real Postgres) | Matches production; no H2 shortcuts |
| Coverage gate at 80% minimum via JaCoCo | Enforced via `jacoco:check` goal |
| Build Docker image only on `main` | PRs validate; main deploys |
| `-DskipTests` on the `build` job only — tests ran in `test` job | Avoid double-running tests |
| OWASP Dependency Check mandatory on every PR | Catch CVEs before merge |
| Generate SBOMs and signed provenance for production images | Supply chain integrity |

---

## SECTION 4 — JACOCO COVERAGE GATE (pom.xml)

```xml
<!-- pom.xml — JaCoCo plugin setup -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <!-- Attaches the agent before tests run -->
        <execution>
            <id>prepare-agent</id>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <!-- Generates the HTML/XML report after tests -->
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
        <!-- Fails the build if coverage drops below 80% -->
        <execution>
            <id>check</id>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>INSTRUCTION</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.75</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
                <excludes>
                    <!-- Exclude generated code, config classes, and entry point -->
                    <exclude>**/*Application.class</exclude>
                    <exclude>**/config/**</exclude>
                    <exclude>**/dto/**</exclude>
                    <exclude>**/model/**</exclude>
                </excludes>
            </configuration>
        </execution>
    </executions>
</plugin>
```

---

## SECTION 5 — CHECKSTYLE + SPOTBUGS + PMD (pom.xml)

```xml
<!-- Checkstyle — enforces code style rules -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.4.0</version>
    <configuration>
        <configLocation>checkstyle.xml</configLocation>
        <failsOnError>true</failsOnError>
        <consoleOutput>true</consoleOutput>
        <excludes>**/generated/**</excludes>
    </configuration>
    <executions>
        <execution>
            <phase>validate</phase>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>

<!-- SpotBugs — static analysis for bug patterns -->
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.8.6.2</version>
    <configuration>
        <effort>Max</effort>
        <threshold>Medium</threshold>
        <failOnError>true</failOnError>
        <excludeFilterFile>spotbugs-exclude.xml</excludeFilterFile>
        <plugins>
            <!-- find-sec-bugs: security-focused SpotBugs rules -->
            <plugin>
                <groupId>com.h3xstream.findsecbugs</groupId>
                <artifactId>findsecbugs-plugin</artifactId>
                <version>1.13.0</version>
            </plugin>
        </plugins>
    </configuration>
    <executions>
        <execution>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>

<!-- PMD — enforces code quality rules -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-pmd-plugin</artifactId>
    <version>3.23.0</version>
    <configuration>
        <failOnViolation>true</failOnViolation>
        <printFailingErrors>true</printFailingErrors>
        <rulesets>
            <ruleset>/category/java/bestpractices.xml</ruleset>
            <ruleset>/category/java/security.xml</ruleset>
        </rulesets>
    </configuration>
    <executions>
        <execution>
            <phase>verify</phase>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

---

## SECTION 6 — PR CHECKS (Required Status Checks)

Configure in repo settings → Branch protection:

- `lint`
- `vuln`
- `test`
- At least 1 approving review
- "Require branches to be up to date"
- "Require linear history" (squash merge only)

---

## SECTION 7 — RELEASE AUTOMATION

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*"]

permissions:
  contents: write
  packages: write
  id-token: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-java@v4
        with:
          java-version: "17"
          distribution: "temurin"
          cache: maven

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF_NAME#v}" >> $GITHUB_OUTPUT

      - name: Set Maven version
        run: mvn versions:set -DnewVersion=${{ steps.version.outputs.VERSION }} --no-transfer-progress

      - name: Build release JAR
        run: mvn package -DskipTests --no-transfer-progress

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push release image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.ref_name }}
            ghcr.io/${{ github.repository }}:latest
          provenance: true
          sbom: true

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: target/*.jar
          generate_release_notes: true
          body: |
            ## Docker Image
            ```
            docker pull ghcr.io/${{ github.repository }}:${{ github.ref_name }}
            ```
```

Tag-based releases: `git tag v1.2.3 && git push --tags` triggers production deploy.

---

## SECTION 8 — DOCKERFILE (distroless, layered JAR)

See `skills/common/deployment.md` Section 1 for the authoritative Dockerfile.
The production standard is `gcr.io/distroless/java17-debian12:nonroot` (or `java21` for Java 21 projects).

```dockerfile
# syntax=docker/dockerfile:1.7

# ── Build stage ──────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /src
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn package -DskipTests -B

# ── Production stage (distroless — no shell, no package manager) ─────────────
FROM gcr.io/distroless/java17-debian12:nonroot

WORKDIR /app
COPY --from=builder /src/target/*.jar /app/app.jar

USER nonroot:nonroot
EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "/app/app.jar"]
```

**Java 21 projects** — swap the production stage base image:
```dockerfile
FROM gcr.io/distroless/java21-debian12:nonroot
```

**When NOT to use distroless** — if you need native agents (Datadog APM, async-profiler), use `eclipse-temurin:17-jre-alpine` and mount the agent as a layer.

---

## SECTION 9 — VULNERABILITY & DEPENDENCY UPDATES

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "maven"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    groups:
      spring:
        patterns: ["org.springframework*", "org.springframework.boot*"]
      testing:
        patterns: ["*junit*", "*mockito*", "*testcontainers*"]
      observability:
        patterns: ["io.micrometer*", "io.opentelemetry*"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
```
