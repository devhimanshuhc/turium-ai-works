# Project Falcon onboarding guide

Falcon is the internal billing service, written in Go and deployed on Kubernetes in the eu-west-1 region. It replaced the legacy Ruby invoicing monolith in March 2025.

## Ownership and on-call

The Payments Platform team owns Falcon. The on-call rotation changes every Monday at 10:00 IST. SEV-1 incidents must be escalated to the engineering manager, Priya Raman, within 15 minutes.

## Deployments

Deployments go through ArgoCD. Production deploys are frozen on Fridays after 14:00 IST and during the last three business days of each month, because invoice generation runs then.

## Local development

Run `make dev` to start Falcon with a seeded Postgres database. Integration tests need the Stripe test key in the STRIPE_TEST_KEY environment variable.
