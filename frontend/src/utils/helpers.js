import { STORAGE_KEYS } from "./constants";
import {
  Code,
  Palette,
  Briefcase,
  BarChart3,
  Globe,
  BookOpen,
} from "lucide-react";

// Token
export const setToken = (token) => {
  sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getToken = () => {
  return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const removeToken = () => {
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
};

// User
export const setUser = (user) => {
  if (user) {
    const normalizedId = user.id || user._id;
    if (normalizedId) {
      user.id = normalizedId;
      user._id = normalizedId;
    }
  }
  sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = () => {
  const user = sessionStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  sessionStorage.removeItem(STORAGE_KEYS.USER);
};

// Clear all auth data
export const clearAuthData = () => {
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER);
  sessionStorage.removeItem("adminInfo");
  sessionStorage.removeItem("tutorInfo");
  sessionStorage.removeItem("studentInfo");
};

// Helpers
export const isAuthenticated = () => !!getToken();

export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (/\s/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[@$!%*?&]/.test(password)) return false;
  return true;
};

export const getPasswordStrength = (password) => {
  if (password.length === 0) return { strength: 0, text: "", color: "#6b7280" };
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  strength = Object.values(checks).filter(Boolean).length;
  const strengthMap = {
    0: { strength: 0, text: "Very Weak", color: "#ef4444" },
    1: { strength: 20, text: "Weak", color: "#ef4444" },
    2: { strength: 40, text: "Fair", color: "#eab308" },
    3: { strength: 60, text: "Good", color: "#3b82f6" },
    4: { strength: 80, text: "Strong", color: "#22c55e" },
    5: { strength: 100, text: "Very Strong", color: "#22c55e" },
  };
  return strengthMap[strength];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return "Something went wrong. Please try again.";
};

// Image upload validation
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const MAX_IMAGE_SIZE_MB = 5;

export const validateImageFile = (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`;
  }
  return null;
};

// Dynamic visual mapping for categories (assigns consistent colors/icons by semantic matching)
export const getCategoryDetails = (title) => {
  if (!title)
    return {
      icon: BookOpen,
      color: "from-purple-500 to-violet-600",
      iconColor: "bg-purple-50 text-purple-600 border-purple-100",
      textColor: "text-purple-600",
    };

  const t = title.toLowerCase();
  if (
    t.includes("web") ||
    t.includes("dev") ||
    t.includes("code") ||
    t.includes("software")
  ) {
    return {
      icon: Code,
      color: "from-emerald-500 to-teal-600",
      iconColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
      textColor: "text-emerald-600",
    };
  }
  if (
    t.includes("design") ||
    t.includes("art") ||
    t.includes("creative") ||
    t.includes("ui")
  ) {
    return {
      icon: Palette,
      color: "from-pink-500 to-purple-600",
      iconColor: "bg-pink-50 text-pink-600 border-pink-100",
      textColor: "text-pink-600",
    };
  }
  if (
    t.includes("business") ||
    t.includes("finance") ||
    t.includes("management") ||
    t.includes("strategy")
  ) {
    return {
      icon: Briefcase,
      color: "from-blue-500 to-indigo-600",
      iconColor: "bg-blue-50 text-blue-600 border-blue-100",
      textColor: "text-blue-600",
    };
  }
  if (t.includes("marketing") || t.includes("sell") || t.includes("growth")) {
    return {
      icon: BarChart3,
      color: "from-orange-500 to-amber-500",
      iconColor: "bg-orange-50 text-orange-600 border-orange-100",
      textColor: "text-orange-600",
    };
  }
  if (t.includes("science") || t.includes("math") || t.includes("data")) {
    return {
      icon: Globe,
      color: "from-cyan-500 to-blue-500",
      iconColor: "bg-cyan-50 text-cyan-600 border-cyan-100",
      textColor: "text-cyan-600",
    };
  }
  return {
    icon: BookOpen,
    color: "from-purple-500 to-violet-600",
    iconColor: "bg-purple-50 text-purple-650 border-purple-100",
    textColor: "text-purple-600",
  };
};
