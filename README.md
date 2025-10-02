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