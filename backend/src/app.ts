import cors from "cors";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { isCorsOriginAllowed } from "./utils/cors.js";
import { authRouter } from "./routes/authRoutes.js";
import { contractRouter } from "./routes/contractRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { invoiceRouter } from "./routes/invoiceRoutes.js";
import { repairOrderRouter } from "./routes/repairOrderRoutes.js";
import { settingsRouter } from "./routes/settingsRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { customerRouter } from "./routes/customerRoutes.js";
import { quotationRouter } from "./routes/quotationRoutes.js";
import { emailSettingsRouter, emailLogsRouter } from "./routes/emailSettingsRoutes.js";
import appointmentRouter from "./routes/appointmentRoutes.js";
import { masterDataRouter } from "./routes/masterDataRoutes.js";
import { supplierRouter } from "./routes/supplierRoutes.js";
import { sparePartRouter } from "./routes/sparePartRoutes.js";
import { inventoryOrderRouter } from "./routes/inventoryOrderRoutes.js";
import { goodsReceiptRouter } from "./routes/goodsReceiptRoutes.js";
import { publicWidgetRouter, repairRequestRouter } from "./routes/repairRequestRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";
import { apiLimiter } from "./middlewares/rateLimiters.js";

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        frameAncestors: ["*"]
      }
    },
    frameguard: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isCorsOriginAllowed(origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Apply rate limiting and routes
app.use("/api/auth", apiLimiter, authRouter);
app.use("/api/contracts", apiLimiter, contractRouter);
app.use("/api/dashboard", apiLimiter, dashboardRouter);
app.use("/api/repair-orders", apiLimiter, repairOrderRouter);
app.use("/api/invoices", apiLimiter, invoiceRouter);
app.use("/api/settings", apiLimiter, settingsRouter);
app.use("/api/settings/email", apiLimiter, emailSettingsRouter);
app.use("/api/email-logs", apiLimiter, emailLogsRouter);
app.use("/api/admin", apiLimiter, adminRouter);
app.use("/api/customers", apiLimiter, customerRouter);
app.use("/api/quotations", apiLimiter, quotationRouter);
app.use("/api/appointments", apiLimiter, appointmentRouter);
app.use("/api/master-data", apiLimiter, masterDataRouter);
app.use("/api/inventory/suppliers", apiLimiter, supplierRouter);
app.use("/api/inventory/parts", apiLimiter, sparePartRouter);
app.use("/api/inventory/orders", apiLimiter, inventoryOrderRouter);
app.use("/api/inventory/receipts", apiLimiter, goodsReceiptRouter);
app.use("/api/public/widget", apiLimiter, publicWidgetRouter);
app.use("/api/repair-requests", apiLimiter, repairRequestRouter);

app.use(notFoundHandler);
app.use(errorHandler);


