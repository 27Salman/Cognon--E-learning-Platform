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
   When a user registers or logs in, the `authController` hashes passwords or validates them against the MongoDB database. Upon success, a JWT is generated and returned to the client. For sensitive actions (like password reset), Nodemailer sends an OTP to the user's email which is verified before proceeding.

2. **Course Creation & File Uploads:**
   When a tutor creates a course, they upload thumbnails and video files. The backend uses `Multer` to intercept the multipart/form-data. These files are then piped directly to `Cloudinary` to be hosted on the cloud, and the resulting secure URLs are saved into the `Course` document in MongoDB.

3. **Real-time Sockets & Call Signaling:**
   In `server.js`, Socket.io is bound to the HTTP server. It listens for `join` events to map connected socket IDs to user IDs. When a student sends a chat or initiates a video call with a tutor, the backend receives the event, optionally saves text messages to MongoDB for persistence, and immediately `emits` the payload (text or call initiation data) to the specific tutor's socket ID for instant delivery. The actual video stream is then established via the ZegoCloud SDK.

4. **Razorpay Integration & Invoicing:**
   When a user initiates checkout, the backend generates a unique `razorpay_order_id`. The client pays via Razorpay, which returns a signature. The backend cryptographically verifies this signature using the Razorpay Secret Key to ensure the payment wasn't tampered with, before marking the database `Order` as `PAID`. Following this, a PDF invoice is generated dynamically via a PDF service and provided to the user.

## 🛠️ Technologies Used

* **Core Framework:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JSON Web Tokens (JWT), bcryptjs
* **Real-time Communication:** Socket.io
* **File Uploads:** Multer, Cloudinary
* **Document Generation:** PDF rendering libraries (PDFKit/Puppeteer equivalent)
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
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   
   # Email Config
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Start the Server:
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```
