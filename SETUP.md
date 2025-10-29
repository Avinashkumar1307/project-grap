# NestJS Authentication Setup Guide

This project includes a complete authentication system with:
- Local authentication (email/password signup and login)
- Google OAuth authentication
- JWT-based session management
- PostgreSQL database with TypeORM

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Google OAuth credentials (for Google login)

## Database Setup

1. Install PostgreSQL if you haven't already
2. Create a new database:
```bash
createdb nestjs_auth
```

Or using PostgreSQL shell:
```sql
CREATE DATABASE nestjs_auth;
```

## Environment Configuration

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your configuration:

### Database Configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=nestjs_auth
```

### JWT Secret
Generate a secure random string for JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Installation

Install dependencies:
```bash
npm install
```

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production mode:
```bash
npm run build
npm run start:prod
```

The application will run on `http://localhost:3000`

## API Endpoints

### Authentication

**Signup** (Local)
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login** (Local)
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Google Login**
```
GET /auth/google
```
This will redirect to Google's OAuth consent screen.

**Google Callback**
```
GET /auth/google/callback
```
This is where Google redirects after authentication.

**Get Profile** (Protected Route)
```
GET /auth/profile
Authorization: Bearer <your-jwt-token>
```

## Testing the APIs

### Using cURL

1. Signup:
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. Get Profile (use the token from login response):
```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. Google Login (open in browser):
```
http://localhost:3000/auth/google
```

### Using Postman or Thunder Client

1. Import the endpoints above
2. For protected routes, add the JWT token in the Authorization header as Bearer token

## Database Schema

The `users` table includes:
- `id` (UUID, Primary Key)
- `email` (Unique)
- `password` (Hashed, nullable for Google users)
- `firstName`
- `lastName`
- `googleId` (For Google OAuth users)
- `isEmailVerified`
- `createdAt`
- `updatedAt`

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Email validation on signup
- Password minimum length of 6 characters
- Protected routes using JWT authentication guard

## Notes

- The database will auto-sync in development mode (synchronize: true)
- In production, set `NODE_ENV=production` and use migrations instead
- Make sure to use a strong, random JWT_SECRET in production
- Keep your Google OAuth credentials secure and never commit them to version control
