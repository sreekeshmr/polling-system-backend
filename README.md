# Polling System Backend

A comprehensive polling system built with Nest.js featuring authentication, role-based access control, and real-time voting capabilities.

## 🚀 Features

- **JWT Authentication** - Secure user registration and login
- **Role-Based Access Control** - Admin and User roles with protected routes
- **Poll Management** - Create, edit, delete, and manage polls
- **Public & Private Polls** - Control poll visibility and access
- **Voting System** - Cast votes with duplicate prevention
- **Poll Expiry** - Automatic expiry with configurable duration (max 2 hours)
- **Real-time Results** - View poll results and statistics

## 🛠️ Technologies Used

- **Backend**: Nest.js, TypeScript
- **Authentication**: JWT, Passport
- **Database**: SQLite (development), TypeORM
- **Security**: bcrypt for password hashing, class-validator for input validation
- **Testing**: Jest (unit & e2e tests)

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## ⚡ Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd polling-system-backend

# Install dependencies
npm install
```
### 2. Environment Setup
Create a .env file in the root directory:

env
# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-change-in-production

# Database Configuration
DATABASE_TYPE=sqlite
DATABASE_NAME=polling.db

# Application Configuration
NODE_ENV=development
PORT=3000
3. Running the Application
bash
# Development mode (with auto-reload)
```bash
npm run start:dev
```
# Production mode
```bash
npm run start:prod
```
# Build the project
```bash
npm run build
```
The application will start on http://localhost:3000

🗄️ Database
The application uses SQLite which requires no additional setup. The database file polling.db will be automatically created in your project root when you first run the application.

🔐 API Endpoints
Authentication
POST /auth/register - Register new user

POST /auth/login - User login

GET /auth/profile - Get user profile

POST /auth/logout - Logout

Users (Admin only)
GET /users - Get all users

GET /users/profile - Get user profile

PATCH /users/profile - Update own profile

GET /users/stats/count - User statistics

Polls
POST /polls - Create poll (Admin only)

GET /polls - Get all accessible polls

GET /polls/my-polls - Get my created polls (Admin only)

GET /polls/:id - Get specific poll

PATCH /polls/:id - Update poll (Admin only)

DELETE /polls/:id - Delete poll (Admin only)

Voting
POST /voting/:pollId/vote - Cast vote

GET /voting/my-votes - Get my voting history

GET /voting/:pollId/results - Get poll results

DELETE /voting/:pollId/vote - Delete my vote

🧪 API Testing with Postman
Postman Collection
Import the Postman collection from the provided json_polling.json file to test all endpoints.

Testing Sequence
Register users - Create admin and regular user accounts

Login - Get JWT tokens for both users

Create polls - Use admin token to create public and private polls

Vote on polls - Use user token to cast votes

View results - Check poll results and statistics

Test permissions - Verify role-based access control

🧪 Running Tests
bash
# Unit tests
```bash
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test in watch mode
npm run test:watch
```
🚀 Deployment
Production Setup
Update .env file:

env
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
Build and run:

```bash
npm run build
npm run start:prod
```
🤝 AI Assistance Disclosure
This project was developed with assistance from AI tools (DeepSeek) to enhance development speed and code quality.

How AI Was Used:
Architecture Guidance: Provided recommendations for Nest.js module structure and project organization

Code Generation: Assisted with boilerplate code for entities, DTOs, services, and controllers

Error Resolution: Helped identify and fix TypeScript compilation errors and runtime issues

Best Practices: Suggested implementation patterns for authentication, validation, and error handling

API Design: Assisted in designing RESTful endpoints and response structures

Documentation: Helped create comprehensive API documentation and setup instructions

Benefits Gained:
Development Speed: Reduced time spent on repetitive code patterns and configuration

Code Quality: Ensured adherence to Nest.js best practices and TypeScript standards

Comprehensive Coverage: Helped identify edge cases and validation requirements

Learning Enhancement: Provided explanations for complex concepts and implementation details

Error Prevention: Assisted in catching potential bugs and security issues early

Human Oversight:
All AI-generated code was reviewed, tested, and modified by the developer to ensure:

Business logic correctness

Security implementations

Performance optimizations

Integration with existing codebase

Compliance with assignment requirements

📞 Support
For issues or questions:

Check the API documentation above

Verify environment variables are properly set

Ensure all dependencies are installed

Review the test cases for usage examples

📄 License
This project is licensed under the MIT License.