import cors from "cors";
import express from "express";
import { isCorsOriginAllowed } from "./utils/cors.js";
import { authRouter } from "./routes/authRoutes.js";
import { contractRouter } from "./routes/contractRoutes.js";
import { dashboardRouter } from "./routes/dashboardRoutes.js";
import { invoiceRouter } from "./routes/invoiceRoutes.js";
import { repairOrderRouter } from "./routes/repairOrderRoutes.js";
import { settingsRouter } from "./routes/settingsRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorMiddleware.js";

export const app = express();

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
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/contracts", contractRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/repair-orders", repairOrderRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/admin", adminRouter);

app.use(notFoundHandler);
app.use(errorHandler);

