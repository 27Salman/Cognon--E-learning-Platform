# Cognon Frontend

This is the frontend application for Cognon, a modern E-Learning platform. It is a robust Single Page Application (SPA) built with React, optimized with Vite, and beautifully styled with Tailwind CSS to deliver a premium and highly interactive user experience.

## ✨ Key Features

* **Dynamic Dashboards:** Tailored, feature-rich interfaces for three distinct roles:
  * **Students:** Browse catalogs, enroll in courses, track progress, watch videos, view certificates, and chat/video call with tutors.
  * **Tutors:** Create and edit courses, upload media, view revenue analytics, and answer student questions in real-time.
  * **Admins:** Manage user statuses (block/unblock), approve/reject tutor profiles, handle platform categories, and view global revenue/orders.
* **Assessments & Anti-Cheating:** Secure interactive quiz interfaces that enforce full-screen modes and monitor tab-switching to ensure academic integrity, automatically rewarding students with downloadable **PDF certificates** upon passing.
* **Reporting & Invoicing:** Beautifully rendered data visualizations for analytics and revenue. Features one-click downloads for **PDF invoices** for students, and exportable **analytics reports** for admins and tutors.
* **Course Catalog & Player:** An intuitive course browsing experience with dynamic filters, and an interactive video player with progress tracking and resource downloads.
* **Real-time Communication:** WebSocket-powered chat interface and integrated **Video Calling** for immediate student-tutor communication, featuring typing indicators, online statuses, and read receipts.
* **State Management:** Predictable, centralized state handling using Redux Toolkit to persist auth, user profiles, and cart states.
* **Premium Aesthetics:** High-quality UI components, glassmorphism effects, dynamic color meshes, and smooth micro-animations using Tailwind CSS.

## 📁 Folder Structure

```text
frontend/
├── public/                 # Static assets (images, icons)
├── src/
│   ├── api/                # Axios instances and API service calls (authAPI, studentAPI, etc.)
│   ├── assets/             # Internal project images and SVGs
│   ├── components/         # Reusable React components
│   │   ├── common/         # Buttons, Inputs, Modals, Navbar, Footer
│   │   ├── student/        # Student-specific UI elements (Course Cards, Quizzes, Certificates)
│   │   ├── tutor/          # Tutor-specific UI elements (Curriculum Builder, Reports)
│   │   └── admin/          # Admin-specific tables and graphs
│   ├── pages/              # Main route views (Home, Login, Dashboards, Checkout)
│   ├── store/              # Redux setup (store.js) and slices (authSlice, studentSlice)
│   ├── utils/              # Helper functions, constants, validation schemas
│   ├── App.jsx             # Main routing component with ProtectedRoutes
│   └── main.jsx            # React DOM rendering and Context providers
├── index.html              # Entry HTML file
├── package.json            # Dependencies and scripts
├── tailwind.config.js      # Tailwind theme extensions and custom colors
└── vite.config.js          # Vite bundler configuration
```

## ⚙️ How It Works (Core Workings)

1. **Authentication Flow:** 
   Upon login, the backend issues a JWT. The frontend stores this token in `sessionStorage` and saves the user payload in the Redux `authSlice`. Every subsequent API call via Axios uses an interceptor to automatically attach this Bearer token to the request headers. Private Routes (`<ProtectedRoute>`) check the Redux state to ensure the user has the correct role before rendering the page.

2. **Real-time Chat & Video Engine:** 
   The `StudentChat` and `TutorChat` pages instantiate a `Socket.io-client` connection on mount. The frontend emits `join` events with the user ID, listens for `new-message`, and dispatches local state updates immediately to reflect messages without refreshing the page. Video calls are facilitated using the ZegoCloud SDK, with sockets acting as the signaling pathway to initiate the calls.

3. **Payments & Checkout:** 
   When a student checks out, the frontend requests a Razorpay Order ID from the backend. The frontend then initializes the Razorpay SDK window. Upon success, it sends the signature back to the backend for verification before redirecting the student to an "Order Success" page where they can download their PDF Invoice.

## 🛠️ Technologies Used

* **Core Framework:** React 18, Vite
* **Routing:** React Router DOM
* **State Management:** Redux Toolkit
* **Styling & UI:** Tailwind CSS, Lucide React (Icons), React Hot Toast
* **API Communication:** Axios
* **Real-time Engine:** Socket.io-client (Chat & Signaling), ZegoCloud (Video Calls)
* **Media Handling:** Cloudinary Upload Widget

## 🚀 Quick Start

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root of the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_APP_NAME=Cognon
   # Add your Razorpay test key here if required on the frontend
   VITE_RAZORPAY_KEY_ID=rzp_test_yourkey
   ```

3. Start the Development Server:
   ```bash
   npm run dev
   ```

### Building for Production
To create an optimized, production-ready build:
```bash
npm run build
```
