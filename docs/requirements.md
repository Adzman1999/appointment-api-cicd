
# Appointment API — Requirements

## Project goal

Build a secure appointment booking API that can be tested,
built, deployed, and verified through an automated CI/CD pipeline.

## Initial API requirements

### Health endpoint

- GET /health returns HTTP 200 when the application is running.
- The response is valid JSON.
- The response identifies the service.
- The endpoint must not expose credentials or sensitive data.

## Future business requirements

- Users can register and authenticate.
- Providers can publish available appointment slots.
- Authenticated users can book available slots.
- Users cannot access another user's private bookings.
- A slot cannot be double-booked.
- Invalid requests return predictable error responses.
- Database operations preserve data integrity.
- Booking and cancellation behavior is covered by automated tests.

## CI requirements

- Changes trigger automated checks.
- Required tests must pass before merge.
- Type checking and production build must pass.
- Integration tests use an isolated test database.
- Secrets must not be committed to the repository.

## Deployment requirements

- Deployment is triggered only through the approved workflow.
- The deployed application must pass health and smoke tests.
- Production configuration must be supplied securely.
- Failed deployments must have a documented recovery procedure.

## Acceptance criteria

1. The project installs reproducibly using npm ci.
2. npm run typecheck succeeds.
3. npm run build succeeds.
4. GET /health returns HTTP 200 and valid JSON.
5. Automated tests are added and enforced in later phases.
6. The deployed URL is verified before a release is considered healthy.
