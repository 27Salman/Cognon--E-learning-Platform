# Cognon Backend

This is the robust RESTful API and WebSocket server powering the Cognon E-Learning platform. It securely handles user authentication, complex business logic, database interactions, dynamic document generation, and high-performance real-time messaging.

## ✨ Key Features

* **Role-Based Access Control (RBAC):** Secure authentication and authorization using JSON Web Tokens (JWT) for Students, Tutors, and Admins.
* **Document Generation:** Automated generation of customized **PDF Certificates** upon course completion and **PDF Invoices** upon successful checkout, streamed directly to the client.
* **Assessment Engine:** Backend logic for evaluating student quizzes, tracking scores, and handling events triggered by the frontend's **anti-cheating mechanisms** (e.g., logging tab-switching violations).
* **Course & Category Management:** Comprehensive endpoints for creating, updating, and querying hierarchical course content (modules, lessons) with media upload integrations.
* **Real-time Engine:** Socket.io integration enabling instant messaging, online statuses, and signaling to initiate peer-to-peer **Video Calls** between students and tutors via ZegoCloud.
* **Payment Processing:** Seamless integration with Razorpay for handling secure course transactions, student wallets, and tutor payouts.
* **Data Integrity:** Strict Mongoose schemas with validation rules (min/max lengths, regex, required fields) for reliable database operations.
* **Security:** Password hashing (bcrypt), OTP email verifications (Nodemailer), and robust error handling middlewares.

## 📁 Folder Structure

```text
backend/
├── src/
│   ├── config/             # Database connection, Razorpay, Cloudinary configurations
│   ├── controllers/        # Request handlers (authController, courseController, adminController)
│   ├── middlewares/        # Custom middlewares (authMiddleware, errorMiddleware, multer)
│   ├── models/             # Mongoose schemas (User, Course, Category, Order, Message)
│   ├── routes/             # Express routers directing endpoints to controllers
│   ├── services/           # Reusable business logic (emailService, paymentService, pdfService)
│   └── utils/              # Helper functions (token generator, custom error classes)
├── server.js               # Main entry point (Express app setup & Socket.io initialization)
├── package.json            # Node dependencies
└── .env.example            # Environment variables template
```

## ⚙️ How It Works (Core Workings)

1. **Authentication Workflow:**
   When a user registers or logs in, `authService` verifies credentials and issues a short-lived **15-minute Access Token** along with a **7-day Refresh Token** saved in a secure `httpOnly` cookie. When the Access Token expires, the client hits `/api/auth/refresh` to obtain a new Access Token seamlessly. For password resets, Nodemailer sends an OTP which is verified before password modification.

2. **Security & Helmet Headers:**
   The backend implements a centralized Helmet configuration (`src/config/helmet.js`) with Content Security Policy (CSP) directives that restrict resources, enabling smooth integration with Razorpay modals, Google Fonts, Cloudinary media, and WebSockets while protecting against XSS and Clickjacking.

3. **Course Creation & File Uploads:**
   When a tutor creates a course, they upload thumbnails and video files. The backend uses `Multer` to intercept multipart/form-data, uploads them directly to `Cloudinary`, and saves secure URLs into MongoDB.

4. **Real-time Sockets & Call Signaling:**
   In `server.js`, Socket.io is bound to the HTTP server. It listens for `join` events to map socket IDs to user IDs. Real-time messages are saved to MongoDB and emitted instantly. Video call signaling is passed over WebSockets to establish peer-to-peer streams via ZegoCloud.

5. **Razorpay Integration & Invoicing:**
   When a user initiates checkout, the backend generates a unique `razorpay_order_id`. The client pays via Razorpay, which returns a signature. The backend cryptographically verifies this signature before marking the `Order` as `PAID` and generating a downloadable PDF invoice.

## 🛠️ Technologies Used

* **Core Framework:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** Dual JWT (Access & Refresh Tokens), bcryptjs
* **Real-time Communication:** Socket.io
* **File Uploads:** Multer, Cloudinary
* **Document Generation:** PDF rendering libraries
* **Payments:** Razorpay
* **Mailing:** Nodemailer

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root of the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_ACCESS_SECRET=your_access_token_secret
   JWT_ACCESS_EXPIRE=15m
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_REFRESH_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   
   # Email Config
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # ZegoCloud
   ZEGO_APP_ID=your_zego_app_id
   ZEGO_SERVER_SECRET=your_zego_server_secret
   ```

3. Start the Server:
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```
