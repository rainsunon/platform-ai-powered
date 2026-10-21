# Incident Response

**Applies to:** All production Java Spring Boot services.
**Owner:** Engineering leads + on-call rotation.

---

## SECTION 1 — SEVERITY DEFINITIONS

| Severity | Definition | Examples | Response time |
|----------|-----------|----------|---------------|
| **P0 — Critical** | Complete outage, data loss, security breach | Service down, DB corruption, credentials leaked | Immediate (< 15 min) |
| **P1 — High** | Major feature broken, significant user impact | Payments failing, auth broken, > 5% error rate | < 30 min |
| **P2 — Medium** | Degraded performance, minor feature broken | Slow responses (p99 > 5s), non-critical feature down | < 2 hours |
| **P3 — Low** | Cosmetic, minor inconvenience, workaround exists | UI glitch, non-blocking error in logs | Next business day |

---

## SECTION 2 — ESCALATION PATH

```
Alert fires
  → On-call engineer acknowledges (< 5 min)
    → P0 / P1: page team lead + notify stakeholders
      → No resolution in 30 min: escalate to engineering manager
        → No resolution in 1 hour: escalate to CTO
    → P2: on-call investigates, updates ticket
    → P3: create ticket, handle in next sprint
```

### Communication Channels

| Channel | Use for |
|---------|---------|
| PagerDuty / Opsgenie | P0 / P1 alerts, on-call paging |
| #incidents Slack channel | Real-time coordination during incident |
| Status page | External communication to customers |
| Email | Post-incident summary to stakeholders |

---

## SECTION 3 — INCIDENT COMMANDER ROLE

For P0 / P1 incidents, designate an Incident Commander (IC):

**IC responsibilities:**
1. Coordinate response — assign tasks, prevent duplication.
2. Communicate status updates every 15 minutes.
3. Decide when to escalate.
4. Decide when incident is resolved.
5. Ensure postmortem is scheduled.

**IC does NOT:**
- Debug the issue themselves (unless they're the only one available).
- Make unilateral architectural decisions under pressure.

---

## SECTION 4 — RESPONSE PLAYBOOK

### Step 1: Assess
- What's broken? Check Spring Actuator dashboards, Grafana, error rates, alerts.
- Who's affected? All users, subset, internal only?
- When did it start? Correlate with recent deployments via CI/CD history.

### Step 2: Mitigate (stop the bleeding)
- **Recent deploy?** → rollback immediately via CI/CD pipeline or `kubectl rollout undo`.
- **External dependency down?** → enable Resilience4j circuit breaker / fallback.
- **Traffic spike?** → scale up replicas, enable Spring Boot rate limiting.
- **Thread pool exhaustion / OOM?** → bounce pods; check `jvm.threads.live` and heap dump after restoration.
- **HikariCP pool exhaustion?** → check `hikaricp.connections.pending`; increase pool size or add read replica.
- **Data issue?** → stop writes, assess damage scope before any recovery attempt.

### Step 3: Fix
- Identify root cause — use async-profiler for CPU/memory issues, Actuator `/actuator/threaddump` for thread starvation.
- Implement fix with a regression test.
- Deploy through the normal pipeline (unless P0 hotfix requires a direct push).

### Step 4: Verify
- Confirm error rates back to baseline via `/actuator/metrics/http.server.requests`.
- Confirm `hikaricp.connections.pending` is zero.
- Check affected users can access the service.
- Monitor for 30 minutes post-fix.

### Step 5: Close
- Update status page.
- Notify stakeholders.
- Schedule postmortem within 48 hours.

---

## SECTION 5 — POSTMORTEM TEMPLATE

```markdown
# Postmortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** P0 / P1 / P2
**Incident Commander:** [Name]
**Author:** [Name]

## Summary
One paragraph: what happened, who was affected, how long.

## Timeline (UTC)
| Time | Event |
|------|-------|
| 14:00 | Alert fired: error rate > 5% |
| 14:05 | On-call acknowledged |
| 14:15 | Root cause identified: HikariCP pool exhaustion due to unclosed transactions |
| 14:20 | Rollback initiated |
| 14:25 | Service restored |

## Root Cause
What actually broke and why.

## Impact
- Users affected: X
- Revenue impact: $Y (if applicable)
- Data loss: None / describe

## What Went Well
- Fast detection (alert fired within 2 min)
- Rollback procedure worked as documented

## What Went Wrong
- Spring Actuator `/actuator/heapdump` not gated behind admin auth; took time to access
- No canary deployment caught the issue before full rollout

## Action Items
| Action | Owner | Due date | Ticket |
|--------|-------|----------|--------|
| Gate Actuator management port behind admin auth | @dev | 2026-05-15 | PLAT-123 |
| Implement canary deploys | @devops | 2026-06-01 | PLAT-124 |
| Add `hikaricp.connections.pending` alert threshold | @dev | 2026-05-20 | PLAT-125 |

## Lessons Learned
What should we change to prevent this class of incident?
```

---

## SECTION 6 — ON-CALL RULES

| Rule | Rationale |
|------|-----------|
| Rotate weekly | Prevent burnout |
| Maximum 1 week on-call per month | Sustainable pace |
| On-call has authority to rollback without approval | Speed > process during incidents |
| Handoff document at rotation | Context transfer |
| Compensate on-call (time off or pay) | Respect people's time |
| No on-call for junior devs (< 6 months) | Need experience to handle incidents |
| Runbooks for every alert | On-call should not reverse-engineer at 3am |

### Spring Boot service runbook checklist

For every alert linked to a Spring Boot service, the runbook must answer:

- Which endpoint or service layer method is the likely source? Check `http.server.requests` by `uri` tag.
- How do I access Spring Actuator? (URL + management port + admin auth token)
- How do I take a heap dump? `curl http://host:9090/actuator/heapdump -o heap.hprof`
- How do I take a thread dump? `curl http://host:9090/actuator/threaddump`
- How do I read the structured JSON logs in the alerting time window? (Grafana Loki / ELK query with `traceId` or `request_id`)
- How do I trigger a graceful restart vs. a hard kill? (`kubectl rollout restart` vs. `kubectl delete pod`)
- What is the rollback image tag / Git SHA?
- What are the key Micrometer alert thresholds for this service?
