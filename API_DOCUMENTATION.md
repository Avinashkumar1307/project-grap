# Project Marketplace API Documentation

A comprehensive marketplace platform for selling ML, Web, Mobile, and other software projects with custom project request functionality.

## Features

- **User Authentication**: Email/Password and Google OAuth signup/login
- **Project Management**: Create, read, update, delete projects (ML/Web/Mobile/etc.)
- **Custom Project Requests**: Users can request custom projects with budget in INR
- **Transaction Tracking**: Complete transaction history with INR amounts
- **File Upload**: Support for project images (single and multiple)
- **Role-Based Access**: User, Seller, and Admin roles
- **Search & Filter**: Advanced filtering by category, price range, tags

## Technology Stack

- **Backend**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **File Upload**: Multer
- **Language**: TypeScript

## Database Schema

### Users
- `id` (UUID)
- `email` (unique)
- `password` (hashed)
- `firstName`, `lastName`
- `phone`
- `role` (user/seller/admin)
- `googleId` (for OAuth)
- `isEmailVerified`
- Relationships: projects, customRequests, transactions

### Projects
- `id` (UUID)
- `title`, `description`
- `category` (ml/web/mobile/desktop/fullstack/ai/other)
- `price` (INR)
- `image`, `images[]`
- `tags[]`, `features`, `techStack`
- `demoUrl`, `documentationUrl`
- `views`, `downloads`, `sales`
- `status` (active/sold_out/draft/archived)
- `sellerId` (foreign key to Users)
- Relationships: seller, transactions

### Custom Requests
- `id` (UUID)
- `userId` (foreign key)
- `projectTitle`, `description`
- `projectType` (ml/web/mobile/etc.)
- `requiredFeatures[]`
- `technicalRequirements`
- `budgetInINR`
- `expectedDeliveryDate`
- `status` (pending/in_review/accepted/in_progress/completed/rejected/cancelled)
- `adminNotes`, `quotedPrice`, `estimatedDays`
- `attachments[]`
- Relationships: user

### Transactions
- `id` (UUID)
- `userId` (foreign key)
- `projectId` (foreign key, nullable)
- `customRequestId` (nullable)
- `type` (project_purchase/custom_request_payment/refund)
- `amount` (INR)
- `currency` (default: INR)
- `status` (pending/processing/completed/failed/cancelled/refunded)
- `paymentMethod` (upi/credit_card/debit_card/net_banking/wallet)
- `transactionReference`, `paymentGatewayOrderId`, `paymentGatewayPaymentId`
- `description`, `failureReason`
- `metadata` (JSON)
- Relationships: user, project

## API Endpoints

### Authentication

#### POST /auth/signup
Create a new user account
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210"
}
```

#### POST /auth/login
Login with email and password
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
**Response**: `{ access_token: "jwt_token" }`

#### GET /auth/profile
Get current user profile (requires authentication)

---

### Projects

#### POST /projects
Create a new project (requires authentication)
```json
{
  "title": "E-commerce ML Recommendation System",
  "description": "Complete machine learning recommendation engine...",
  "category": "ml",
  "price": 15000,
  "tags": ["machine-learning", "python", "tensorflow"],
  "features": "Feature list here",
  "techStack": "Python, TensorFlow, Flask, PostgreSQL",
  "demoUrl": "https://demo.example.com",
  "status": "active"
}
```

#### POST /projects/upload
Upload a single project image (requires authentication)
- **Form Data**: `image` (file)
- **Returns**: File path and URL

#### POST /projects/upload-multiple
Upload multiple project images (requires authentication)
- **Form Data**: `images` (multiple files, max 5)
- **Returns**: Array of file paths and URLs

#### GET /projects
Get all projects with filters
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `category` (ml/web/mobile/etc.)
  - `search` (search in title)
  - `minPrice`, `maxPrice`
  - `status`

#### GET /projects/popular
Get popular projects sorted by sales and views
- **Query Parameters**: `limit` (default: 10)

#### GET /projects/latest
Get latest projects
- **Query Parameters**: `limit` (default: 10)

#### GET /projects/my-projects
Get projects created by current user (requires authentication)

#### GET /projects/:id
Get project details by ID

#### PATCH /projects/:id
Update a project (requires authentication, owner only)

#### DELETE /projects/:id
Delete a project (requires authentication, owner only)

#### POST /projects/:id/download
Increment download count (requires authentication)

---

### Custom Requests

#### POST /custom-requests
Create a custom project request (requires authentication)
```json
{
  "projectTitle": "Real Estate Price Prediction System",
  "description": "Need a machine learning system...",
  "projectType": "ml",
  "requiredFeatures": ["Price prediction model", "Admin dashboard"],
  "technicalRequirements": "Backend: Python/FastAPI...",
  "budgetInINR": 50000,
  "expectedDeliveryDate": "2025-12-31"
}
```

#### GET /custom-requests
Get all custom requests (users see only their own, admins see all)

#### GET /custom-requests/my-requests
Get current user's custom requests

#### GET /custom-requests/stats
Get statistics (total, pending, in progress, completed)

#### GET /custom-requests/by-status/:status
Get requests by status (pending/in_review/accepted/in_progress/completed/rejected/cancelled)

#### GET /custom-requests/:id
Get custom request by ID

#### PATCH /custom-requests/:id
Update custom request (owner or admin only)

#### PATCH /custom-requests/:id/status
Update request status (admin only)
```json
{
  "status": "accepted",
  "adminNotes": "Project approved...",
  "quotedPrice": 52000,
  "estimatedDays": 30
}
```

#### DELETE /custom-requests/:id
Delete custom request (owner only, pending/cancelled only)

---

### Transactions

#### POST /transactions
Create a new transaction (requires authentication)
```json
{
  "projectId": "project-uuid-here",
  "type": "project_purchase",
  "amount": 15000,
  "paymentMethod": "upi",
  "description": "Purchase of E-commerce ML Recommendation System",
  "metadata": {
    "upiId": "user@paytm"
  }
}
```

#### GET /transactions
Get all transactions (users see only their own, admins see all)

#### GET /transactions/my-transactions
Get current user's transactions

#### GET /transactions/stats
Get transaction statistics (total, completed, pending, failed, total amount)

#### GET /transactions/history
Get transaction history with date range
- **Query Parameters**: `startDate`, `endDate` (ISO date format)

#### GET /transactions/by-status/:status
Get transactions by status (pending/processing/completed/failed/cancelled/refunded)

#### GET /transactions/project/:projectId
Get all transactions for a specific project

#### GET /transactions/:id
Get transaction by ID

#### PATCH /transactions/:id
Update transaction details

#### PATCH /transactions/:id/status
Update transaction status
```json
{
  "status": "completed",
  "failureReason": "Optional failure reason"
}
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Get the token by calling `/auth/login` or `/auth/signup`.

## Project Categories

- `ml` - Machine Learning
- `web` - Web Development
- `mobile` - Mobile Applications
- `desktop` - Desktop Applications
- `fullstack` - Full Stack Projects
- `ai` - Artificial Intelligence
- `other` - Other Projects

## Transaction Types

- `project_purchase` - Buying a project from marketplace
- `custom_request_payment` - Payment for custom project
- `refund` - Refund transaction

## Payment Methods

- `upi` - UPI Payment
- `credit_card` - Credit Card
- `debit_card` - Debit Card
- `net_banking` - Net Banking
- `wallet` - Digital Wallet

## Status Values

### Project Status
- `active` - Available for purchase
- `sold_out` - No longer available
- `draft` - Not yet published
- `archived` - Archived project

### Custom Request Status
- `pending` - Awaiting review
- `in_review` - Being reviewed by admin
- `accepted` - Request accepted
- `in_progress` - Work in progress
- `completed` - Work completed
- `rejected` - Request rejected
- `cancelled` - Cancelled by user

### Transaction Status
- `pending` - Payment pending
- `processing` - Payment processing
- `completed` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded

## File Upload

- **Supported formats**: JPG, JPEG, PNG, GIF, WEBP
- **Max file size**: 5MB per image
- **Upload location**: `/uploads/projects/`
- **Access**: Files are served statically at `http://localhost:3000/uploads/projects/{filename}`

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database
   JWT_SECRET=your_secret_key
   ```

3. Run migrations:
   ```bash
   npm run migration:generate -- src/migrations/InitialSchema
   npm run migration:run
   ```

4. Start the server:
   ```bash
   npm run start:dev
   ```

5. Import Postman collection:
   - Open Postman
   - Click Import
   - Select `Project-Marketplace-API.postman_collection.json`
   - Set the `base_url` variable to your server URL
   - After login, the `access_token` is automatically saved

## Error Responses

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development Notes

- All prices are in INR (Indian Rupees)
- UUIDs are used for all primary keys
- Soft delete is not implemented (use status fields instead)
- File uploads are stored locally (consider S3 for production)
- Payment gateway integration is not included (implement as needed)
- Email verification is tracked but not implemented (add email service)

## Security Considerations

- Passwords are hashed using bcrypt
- JWT tokens expire (configure in auth module)
- File upload validation prevents malicious files
- SQL injection protection via TypeORM
- CORS should be configured for production
- Rate limiting recommended for production
- Input validation using class-validator

## Future Enhancements

1. Payment gateway integration (Razorpay/Stripe)
2. Email notifications
3. Real-time notifications (WebSocket)
4. Advanced search (Elasticsearch)
5. Review and rating system
6. Seller analytics dashboard
7. Project version management
8. Automated testing suite
9. API documentation with Swagger
10. File storage on S3/CloudFlare
