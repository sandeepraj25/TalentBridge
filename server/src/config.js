import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rojgaar",
  },
  paymentEncryptionKey: process.env.PAYMENT_ENCRYPTION_KEY || process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  payments: {
    activeGateway: (process.env.PAYMENT_ACTIVE_GATEWAY || "").toLowerCase().trim(),
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID || "",
      keySecret: process.env.RAZORPAY_KEY_SECRET || "",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    },
    cashfree: {
      appId: process.env.CASHFREE_APP_ID || "",
      secretKey: process.env.CASHFREE_SECRET_KEY || "",
      webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || "",
      env: (process.env.CASHFREE_ENV || "sandbox").toLowerCase() === "production" ? "production" : "sandbox",
    },
  },
};
