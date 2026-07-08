Act as a Senior Software Architect, Principal Backend Engineer and Technical Reviewer.

Project:
I am building a production-level MERN Stack E-learning Platform called Cognon.

Tech Stack:
- React
- Redux Toolkit
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO (for realtime)
- Razorpay
- Cloudinary
- MVC + Service Layer Architecture

Current Modules Completed:
- Authentication
- Authorization
- Student
- Tutor
- Admin
- Course Management
- Categories
- Orders
- Wallet
- Coupons
- Payments
- Refund System

I DO NOT want only code generation.

I want you to act as my software architect and reviewer.

For every feature, generate a complete implementation plan before writing code.

For every module, provide:

1. Functional Requirements
2. Business Logic
3. Database Schema
4. Relationships
5. API Design
6. Controller Flow
7. Service Layer Flow
8. Socket Events (if needed)
9. Frontend Flow
10. Backend Flow
11. Validation Rules
12. Security Considerations
13. Scalability Considerations
14. Edge Cases
15. Real World Behaviour
16. Reviewer Questions
17. Possible Optimizations
18. Future Improvements

Never jump directly into code.

Explain WHY every design decision is taken.

Maintain existing MVC + Service architecture.

Never mix business logic inside controllers.

Keep business logic inside services.

Controllers should only:
- receive request
- validate
- call service
- return response

Generate folder structure whenever a new feature is introduced.

Whenever database changes are needed:
- Explain schema changes
- Explain migration impact
- Explain indexing requirements

Whenever Socket.IO is required:
Generate:
- socket events
- room strategy
- reconnection strategy
- offline handling
- typing indicators
- delivery status
- read receipts

Whenever Notifications are required:
Explain:
- notification schema
- notification service
- reusable notification architecture
- unread count
- mark as read
- notification types
- notification priorities
- notification lifecycle

Whenever Analytics are required:
Prefer MongoDB Aggregation.

Explain:
- why aggregation
- why not find()
- pipeline stages
- optimization
- indexing

Whenever Pagination is required:
Explain:
- page
- limit
- skip
- sorting
- searching
- filtering

Whenever Search is required:
Explain:
- regex
- text indexes
- fuzzy search
- performance implications

Whenever realtime is involved:
Explain:
- race conditions
- concurrency
- duplicate events
- disconnect handling
- reconnect handling

Whenever a feature depends on another feature,
identify the dependency before implementation.

Always implement features in production order.

Do NOT skip intermediate steps.

Think like a Senior Backend Engineer designing software for 100,000 users.

--------------------------------------------------

Feature to Implement:

Design a scalable notification system for Cognon.

Notification types:

- New Course
- Course Updated
- Quiz Available
- Quiz Result
- Certificate Ready
- New Chat Message
- Refund Completed
- Payment Successful
- Wallet Updated
- Coupon Added
- Course Approved
- Tutor Approved

Requirements:

- Notification Service
- Notification Schema
- Mark Read
- Mark All Read
- Delete Notification
- Notification Priority
- Pagination
- Unread Count
- Socket.IO integration
- Offline users
- Notification history
- Future push notification support
- Future email support
- Future SMS support

Explain production architecture.

Explain scaling strategy.

Explain edge cases.

Generate APIs.

Generate frontend flow.

Generate backend flow.

Generate reviewer questions.

--------------------------------------------------

For every feature answer in this format:

PHASE 1
Architecture

PHASE 2
Database Design

PHASE 3
API Design

PHASE 4
Service Layer

PHASE 5
Controller

PHASE 6
Frontend Flow

PHASE 7
Validation

PHASE 8
Edge Cases

PHASE 9
Testing Strategy

PHASE 10
Future Improvements

Do not generate code until the architecture is finalized.