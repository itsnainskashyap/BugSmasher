# OnionPay

## Overview

OnionPay is a secure, semi-automatic payment gateway system built for easy integration into any website or application. The system enables UPI-based payments through QR codes with a 5-minute timer mechanism and admin approval workflow. It provides a comprehensive dashboard for payment management, product catalog, and real-time analytics.

The application features a modern React frontend with a professional purple-themed UI, an Express.js backend with PostgreSQL database, and real-time WebSocket communication for instant payment updates. The system is designed to be deployed on Replit with minimal configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for fast development and building
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live payment updates
- **Theme**: Purple-based color scheme (#6A1B9A primary) with custom OnionLogo component

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **File Upload**: Multer middleware for QR code image handling
- **Real-time Features**: WebSocket server for instant notifications
- **API Design**: RESTful endpoints with comprehensive error handling

### Database Schema
- **Users Table**: Stores admin user information from Replit Auth
- **Products Table**: Product catalog with pricing in paise
- **QR Codes Table**: Manages UPI QR codes and payment details
- **Orders Table**: Tracks payment orders with status management
- **API Keys Table**: Handles external API access authentication
- **Sessions Table**: Manages user session data

### Payment Flow Architecture
1. **Initiation**: External applications call `/api/onionpay/initiate` with order details
2. **Display**: Professional payment page with QR code and 5-minute countdown timer
3. **Submission**: Users submit UTR (Unique Transaction Reference) via `/api/onionpay/submit`
4. **Verification**: Admin dashboard shows pending payments for manual approval
5. **Completion**: Real-time updates via WebSocket notify all connected clients

### Security Architecture
- **Authentication**: Replit OAuth 2.0 with JWT session management
- **Authorization**: Role-based access control for admin functions
- **Rate Limiting**: Express rate limiting on API endpoints
- **File Upload Security**: Image type validation and size limits
- **Session Security**: HTTP-only cookies with secure flags
- **Database Security**: Parameterized queries via Drizzle ORM

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Neon serverless connection
- **Authentication**: Replit Auth service integration
- **Session Storage**: PostgreSQL-based session management
- **File Storage**: Local filesystem for QR code images

### Third-party Libraries
- **Frontend**: React, TanStack Query, Radix UI, Tailwind CSS, Wouter
- **Backend**: Express.js, Drizzle ORM, Multer, WebSocket (ws)
- **Development**: Vite, TypeScript, ESBuild for production builds
- **UI Components**: Comprehensive Radix UI component library with custom styling

### Deployment Dependencies
- **Runtime**: Node.js with ES modules support
- **Build System**: Vite for frontend, ESBuild for backend bundling
- **Environment**: Replit-specific plugins for development and deployment
- **Database**: PostgreSQL connection via environment variables

### Integration APIs
- **Payment Gateway**: Semi-automatic UPI payment verification
- **Webhook System**: Callback URLs for payment status updates
- **External Integration**: RESTful API for third-party applications
- **Real-time Updates**: WebSocket connections for live dashboard updates