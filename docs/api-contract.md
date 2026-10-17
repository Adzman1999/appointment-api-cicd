
# Appointment API Contract

## Health

### GET /health
- 200: API is running.

## Authentication

### POST /auth/register
Request:
- email: valid email string
- password: string, 12–72 characters

Responses:
- 201: account created
- 400: invalid request
- 409: email already exists

### POST /auth/login
Request:
- email: valid email string
- password: non-empty string, maximum 72 characters

Responses:
- 200: login successful
- 400: invalid request
- 401: invalid credentials

## Appointments

All appointment endpoints require:
Authorization: Bearer <access-token>

### POST /appointments
Request:
- slotId: positive integer JSON number

Responses:
- 201: appointment created
- 400: invalid request
- 401: authentication required
- 404: slot not found
- 409: slot already booked or booking conflict

### DELETE /appointments/:id
Request:
- id: positive integer in the URL

Responses:
- 200: cancellation successful
- 400: invalid ID
- 401: authentication required
- 403: appointment belongs to another user
- 404: appointment not found
- 409: appointment cannot be cancelled in its current state

## Error Response

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "slotId",
        "message": "Expected a number"
      }
    ]
  }
}
