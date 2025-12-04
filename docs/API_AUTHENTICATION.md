# API Authentication Guide

## How to Pass Token in curl Requests

### Step 1: Login to Get a Token

First, login as an admin user to get a JWT token:

```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kayak.com",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "999-99-9999",
    "email": "admin@kayak.com",
    "isAdmin": true,
    ...
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 2: Use the Token in API Requests

Copy the `token` value from the response and use it in the `Authorization` header:

```bash
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Complete Example (One-liner)

```bash
# Get token and use it in one command
TOKEN=$(curl -s -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kayak.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Use the token
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer $TOKEN"
```

### With Query Parameters

```bash
curl "http://localhost:8004/api/admin/host/clicks-per-page?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Default Admin Credentials

- **Email:** `admin@kayak.com`
- **Password:** `admin123`
- **Admin ID:** `ADM001` or `999-99-9999`

## Token Format

The token must be passed in the `Authorization` header with the format:
```
Authorization: Bearer <token>
```

The middleware expects:
1. Header name: `Authorization`
2. Prefix: `Bearer ` (with a space after "Bearer")
3. Token: The JWT token string

## Token Expiration

Tokens expire after **7 days** by default. If you get a 401 error, login again to get a new token.

## Testing Authentication

### Test if token is valid:
```bash
curl http://localhost:4000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test admin access:
```bash
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Errors

### 401 Unauthorized
- Token is missing or invalid
- Token has expired
- Solution: Login again to get a new token

### 403 Forbidden
- Token is valid but user is not an admin
- Solution: Use admin credentials to login

### Missing Authorization Header
```json
{"error": "Authentication required"}
```
- Solution: Add `-H "Authorization: Bearer YOUR_TOKEN"` to your curl command

## Example Script

```bash
#!/bin/bash

# Login and get token
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kayak.com","password":"admin123"}')

# Extract token (using jq if available, or grep)
if command -v jq &> /dev/null; then
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
else
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

# Use token to call admin API
echo "Calling admin API..."
curl http://localhost:8004/api/admin/host/clicks-per-page \
  -H "Authorization: Bearer $TOKEN" | jq .
```

