# Runbook: the site is broken

Somebody says it is down, or an alert fired. This is the order to look in, from
cheapest to most invasive.

## First, decide what "down" means

```bash
# From anywhere: does the site answer, and is its certificate still valid?
curl -sS -o /dev/null -w 'HTTP %{http_code} tls_verify=%{ssl_verify_result}\n' https://staging.vitalpair.app/

# The eight read-only checks, which say which layer is broken rather than just "down".
ssh <deploy-host> 'cd ~/vitalpair/deploy && ./scripts/smoke.sh https://staging.vitalpair.app'
```

`tls_verify` other than 0 is a certificate problem, not an application one. The
smoke test's own output names the failing check.

## Then look at the containers

```bash
ssh <deploy-host> 'docker ps --format "{{.Names}}\t{{.Status}}"'
```

| What you see                     | What it means                                                          |
| -------------------------------- | ---------------------------------------------------------------------- |
| Everything healthy               | The problem is above the containers: DNS, the edge, or the certificate |
| The backend restarting in a loop | It cannot start. Read its log, below                                   |
| A container missing entirely     | Something stopped it. `docker compose up -d` the stack                 |
| Postgres unhealthy               | Nothing else will work. Its log first                                  |

```bash
ssh <deploy-host> 'docker logs --tail 80 vitalpair-staging-backend-1'
ssh <deploy-host> 'docker logs --tail 40 vitalpair-edge-nginx-1'
```

The backend's log is JSON in production and staging. A failure to start is
usually Flyway (a migration that cannot apply) or a missing environment
variable, and both say so in the first twenty lines.

## Common shapes, and what they actually were

| Symptom                                 | Cause seen before                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 502 on every request, backend healthy   | The edge resolved the backend's old address. Fixed by D-1, but `docker exec vitalpair-edge-nginx-1 nginx -s reload` is the manual out |
| The browser refuses the certificate     | The name being served does not match the certificate. `docker logs vitalpair-edge-nginx-1 \| grep 'edge:'` says which names it serves |
| The page loads but every API call fails | Check the bundle is asking the right host. This was #88: it asked for `localhost:8081`                                                |
| Login works, one screen is empty        | A single endpoint failing. The request id in the error response finds it in the log                                                   |
| AI features answer 503                  | The circuit breaker is open, which is deliberate. It closes itself when the model answers again                                       |
| AI features answer 402                  | Not broken. That account has no paid plan                                                                                             |

## Did a deploy cause it?

```bash
ssh <deploy-host> 'cd ~/vitalpair/deploy && cat env/.deployed-staging env/.previous-staging'
```

If the timestamps line up with when it broke, [rollback.md](rollback.md) is the
next page. If nothing was deployed, it is not a rollback: something changed
underneath, and the containers and the certificate are where to look.

## What the alerts will tell you

Prometheus evaluates five rules. On its own page, or in Grafana:

| Alert                        | Means                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| BackendDown                  | Two minutes without a successful scrape                                             |
| BackendRestarted             | Started within the last five minutes. Normal after a deploy, a crash loop otherwise |
| CircuitBreakerOpen           | A dependency is refusing calls. The AI features answer 503                          |
| HeapNearlyFull               | Over 90 percent for ten minutes: a leak, or a limit set too low                     |
| DatabaseConnectionsExhausted | Requests queuing for a connection for five minutes                                  |

There is no Alertmanager, so nothing is emailed. These are seen by looking.

## Afterwards

Write down what it was, in the feature's own document under security findings or
known debt, with the measured impact. The value is not the incident, it is the
next person not having to rediscover it: every row in the table above was
learned this way.
