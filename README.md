# Cognon - Comprehensive E-Learning Platform

Cognon is a robust, full-stack E-Learning platform designed to connect students with expert tutors. Built with modern web technologies, it provides a seamless and engaging experience for learning, teaching, and platform administration.

## 🚀 Key Features

* **Multi-Role Architecture:** Dedicated, secure portals with Role-Based Access Control (RBAC) for Students, Tutors, and Administrators.
* **Advanced Assessments & Certification:** Interactive quizzes featuring built-in **anti-cheating mechanisms** (such as tab-switching detection and full-screen enforcement), culminating in automated **PDF certificate generation** upon successful course completion.
* **Financials & Analytics:** Students receive automated, downloadable **PDF invoices** for their purchases. Tutors and Admins have access to comprehensive dashboard analytics with the ability to export detailed **revenue and sales reports** (Excel/PDF).
* **Real-time Communication:** A built-in live chat and **Video Calling** system connects students and tutors instantly via WebSockets and ZegoCloud, featuring typing indicators, read statuses, and seamless media sharing.
* **Secure Payments:** Integrated payment gateway (Razorpay) for course enrollments, coupon applications, and tutor wallet payouts.
* **Interactive Learning:** HD Video lessons, progress tracking, comprehensive course catalogs, and downloadable course resources.
* **Responsive Design:** A beautiful, accessible, and fully responsive UI featuring dynamic color meshes, glassmorphism, and modern micro-animations (Tailwind CSS).

## 🏗️ System Architecture & Folder Structure

The application follows a standard Client-Server architecture, cleanly separated into two distinct environments:

```text
Cognon/
├── frontend/               # React.js SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/            # Axios API wrappers
│   │   ├── components/     # UI Components grouped by role
│   │   ├── pages/          # Full page views
│   │   └── store/          # Redux Toolkit Global State
│   └── package.json
│
├── backend/                # Node.js + Express REST API
│   ├── src/
│   │   ├── controllers/    # API Request Handlers
│   │   ├── models/         # Mongoose Database Schemas
│   │   ├── routes/         # Express Routing Definitions
│   │   └── middlewares/    # Auth, File Upload (Multer), Error Handling
│   └── server.js           # Entry point & Socket.io setup
│
└── README.md
```

## ⚙️ Core Workings

1. **Authentication & Authorization:** 
   Authentication uses a secure **Dual-Token Architecture** (Access Token + Refresh Token). Upon login, the backend issues a 15-minute Access Token returned in JSON and a 7-day Refresh Token stored in an `httpOnly` cookie (XSS-protected). The frontend stores the Access Token in `sessionStorage` and automatically attaches it to request headers. When the Access Token expires, an Axios interceptor silently calls `/api/auth/refresh` to fetch a new Access Token without interrupting the user. Role-Based Access Control (RBAC) restricts routes by user role (Student, Tutor, Admin).

2. **Real-time Engine (Sockets & ZegoCloud):** 
   Socket.io is implemented to allow live chat communication and signaling for video calls between Students and Tutors. The backend maintains an active registry mapping user IDs to socket IDs. When a message or call request is sent, it is immediately emitted to the recipient's socket for real-time delivery without page reloads. ZegoCloud handles the actual P2P video stream.

3. **Media & File Management:** 
   Course thumbnails, profile pictures, and video lectures are uploaded securely. The frontend sends multipart/form-data to the backend, where `Multer` processes the files and forwards them to `Cloudinary` for optimized cloud hosting.

4. **Document Generation:** 
   The platform dynamically generates downloadable PDFs for both Invoices and Course Completion Certificates. Upon triggering, the backend compiles user data, renders the document, and pipes the PDF stream directly to the frontend for download.

5. **Payment Flow:** 
   When a student enrolls in a paid course, the backend creates a Razorpay order. The frontend opens the Razorpay checkout overlay. Upon successful payment, Razorpay sends a signature back to the backend for cryptographic verification before granting the student access to the course content and generating the invoice.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Redux Toolkit, Tailwind CSS, Lucide React
* **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT
* **Integrations:** Razorpay (Payments), Cloudinary (Media Hosting), Nodemailer (Email/OTP)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Cognon
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   npm install
   # Create a .env file (See backend/README.md for required variables)
   npm run dev
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env file (See frontend/README.md for required variables)
   npm run dev
   ```

## 📄 License
This project is licensed under the MIT License.
