# Postmortem: checkout outage on 14 September 2025

## Summary

From 09:12 to 10:03 IST on 14 September 2025, 38% of checkout requests failed with HTTP 502. The incident was classified SEV-1.

## Root cause

A configuration change reduced the connection pool size of the payments-gateway service from 200 to 20. Under morning traffic the pool was exhausted, requests queued past the 30-second timeout, and the load balancer returned 502 errors. The change had been reviewed but not load tested.

## Resolution

The on-call engineer rolled back the configuration at 09:58 IST, and error rates returned to normal by 10:03 IST.

## Action items

1. Add a CI check that blocks pool-size changes greater than 50% without a load test (owner: Arjun Mehta).
2. Alert when pool utilisation exceeds 80% for five minutes (owner: Payments Platform team).
