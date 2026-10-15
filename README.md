
# Appointment API CI/CD Project

A production-minded appointment booking API built to practice
automated testing, continuous integration, containerization,
deployment, and operational verification.

## Stack

- Node.js
- TypeScript
- Express
- PostgreSQL (later phase)
- Vitest and Supertest (later phase)
- GitHub Actions
- Docker

## Prerequisites

- A supported Node.js release
- npm
- Git

## Local development

Install dependencies:

    npm ci

Run the development server:

    npm run dev

Check the API:

    curl -i http://localhost:3000/health

Build:

    npm run build

Type-check:

    npm run typecheck

## Safety

Never commit credentials or production secrets.
Use an isolated test database for automated tests.
Do not run destructive database commands against production.
