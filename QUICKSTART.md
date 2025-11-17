# Quick Start Guide - Project Marketplace API

This guide will help you set up and run the Project Marketplace API in minutes.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Step 1: Environment Setup

The `.env` file is already configured. Verify the database credentials:

```bash
cat .env.example
```

Make sure your `.env` file has the correct database settings:
- DB_HOST=localhost
- DB_PORT=5432
- DB_USERNAME=superadmin
- DB_PASSWORD=tinkerbunker
- DB_NAME=chutiya_avinash

## Step 2: Database Setup

Create the PostgreSQL database if it doesn't exist:

```bash
psql -U postgres
CREATE DATABASE chutiya_avinash;
\q
```

## Step 3: Install Dependencies (Already Done)

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## Step 4: Run Database Migrations

Run the migrations to create all tables:

```bash
npm run migration:run
```

This will create the following tables:
- `users` - User accounts with roles
- `projects` - Marketplace projects (ML/Web/Mobile)
- `custom_requests` - Custom project requests
- `transactions` - Payment and transaction history
- `purchases` - Legacy purchase tracking

## Step 5: Start the Server

Start the development server:

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

## Step 6: Test the API

### Using Postman

1. Import the Postman collection:
   - Open Postman
   - Click **Import**
   - Select `Project-Marketplace-API.postman_collection.json`
   - The collection will be imported with all endpoints

2. Set up environment variables in Postman:
   - `base_url`: `http://localhost:3000`
   - `access_token`: (will be set automatically after login)

3. Test the authentication flow:
   - Run **Auth → Sign Up** to create a new user
   - Run **Auth → Login** to get a JWT token (automatically saved)
   - Run **Auth → Get Profile** to verify authentication

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

Save the `access_token` from the response.

**Get Profile:**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 7: Create Your First Project

```bash
curl -X POST http://localhost:3000/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "ML Price Prediction System",
    "description": "Machine learning system for price prediction",
    "category": "ml",
    "price": 15000,
    "tags": ["machine-learning", "python", "tensorflow"],
    "status": "active"
  }'
```

## Step 8: Browse Projects

```bash
curl -X GET "http://localhost:3000/projects?page=1&limit=10"
```

## API Features Overview

### Authentication
- ✅ Email/Password signup and login
- ✅ Google OAuth login
- ✅ JWT token authentication
- ✅ User profile management

### Projects
- ✅ Create/Read/Update/Delete projects
- ✅ Upload project images (single/multiple)
- ✅ Filter by category (ML/Web/Mobile/etc.)
- ✅ Search by title
- ✅ Price range filtering
- ✅ Popular and latest projects
- ✅ View tracking
- ✅ Download tracking

### Custom Requests
- ✅ Submit custom project requests
- ✅ Specify budget in INR
- ✅ Track request status
- ✅ Admin can quote price and timeline
- ✅ Status management (pending → accepted → in_progress → completed)

### Transactions
- ✅ Create transaction records
- ✅ Multiple payment methods (UPI/Cards/Net Banking)
- ✅ Transaction history
- ✅ Transaction statistics
- ✅ Filter by status
- ✅ Date range filtering

## Common Tasks

### Upload a Project Image

```bash
curl -X POST http://localhost:3000/projects/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### Create a Custom Request

```bash
curl -X POST http://localhost:3000/custom-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectTitle": "Real Estate App",
    "description": "Need a mobile app for real estate listings",
    "projectType": "mobile",
    "budgetInINR": 50000,
    "requiredFeatures": ["Property search", "Map integration", "Chat"]
  }'
```

### Create a Transaction

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectId": "PROJECT_UUID_HERE",
    "type": "project_purchase",
    "amount": 15000,
    "paymentMethod": "upi"
  }'
```

## Project Structure

```
src/
├── auth/                   # Authentication module
│   ├── guards/             # JWT and Google OAuth guards
│   ├── strategies/         # Passport strategies
│   └── dto/                # Login/Signup DTOs
├── users/                  # User management
│   └── entities/           # User entity
├── projects/               # Project marketplace
│   ├── entities/           # Project entity
│   ├── dto/                # Create/Update/Filter DTOs
│   ├── projects.service.ts
│   └── projects.controller.ts
├── custom-requests/        # Custom project requests
│   ├── entities/           # CustomRequest entity
│   ├── dto/                # Request DTOs
│   ├── custom-requests.service.ts
│   └── custom-requests.controller.ts
├── transactions/           # Transaction tracking
│   ├── entities/           # Transaction entity
│   ├── dto/                # Transaction DTOs
│   ├── transactions.service.ts
│   └── transactions.controller.ts
└── migrations/             # Database migrations
```

## Troubleshooting

### Database Connection Issues

If you get a database connection error:

1. Check PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l | grep chutiya_avinash
   ```

3. Test connection:
   ```bash
   psql -U superadmin -d chutiya_avinash -h localhost
   ```

### Migration Issues

If migrations fail, you can reset the database:

```bash
npm run migration:revert
npm run migration:run
```

### Port Already in Use

If port 3000 is already in use, change it in `.env`:

```
PORT=3001
```

## Next Steps

1. **Explore the Postman Collection**: Test all 40+ API endpoints
2. **Read API_DOCUMENTATION.md**: Detailed API documentation
3. **Check the Database Schema**: Review the entity files
4. **Implement Payment Gateway**: Integrate Razorpay or Stripe
5. **Add Email Service**: For notifications and verification
6. **Deploy**: Deploy to your preferred cloud platform

## Useful Commands

```bash
# Development
npm run start:dev          # Start with hot reload

# Build
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

## Default User Roles

- **user**: Can browse projects, make purchases, submit custom requests
- **seller**: Can create and manage projects (assign via database)
- **admin**: Can manage all requests and transactions (assign via database)

To change a user's role, update the database directly:

```sql
UPDATE users SET role = 'seller' WHERE email = 'user@example.com';
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Support

For issues or questions:
1. Check API_DOCUMENTATION.md for detailed API info
2. Review the Postman collection examples
3. Check the code comments in entity files

## Production Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Update database credentials
- [ ] Configure CORS for your frontend domain
- [ ] Set up SSL/HTTPS
- [ ] Configure file upload to S3/CloudFlare
- [ ] Add rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Add email service for notifications
- [ ] Integrate payment gateway
- [ ] Add API documentation (Swagger)
- [ ] Set up CI/CD pipeline

Happy coding! 🚀
