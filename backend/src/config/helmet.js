const helmet = require("helmet");

const razorpayDomains = [
  "https://checkout.razorpay.com",
  "https://api.razorpay.com",
  "https://cdn.razorpay.com",
  "https://lumberjack.razorpay.com",
];

const helmetConfig = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        ...razorpayDomains,
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://checkout.razorpay.com",
      ],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https:"],
      frameSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ],
      connectSrc: ["'self'", ...razorpayDomains, "wss:", "ws:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
});

module.exports = helmetConfig;
