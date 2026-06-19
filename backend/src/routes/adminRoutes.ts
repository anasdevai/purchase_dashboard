import { Router } from "express";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/adminMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminUserController from "../controllers/adminUserController.js";
import * as adminDataController from "../controllers/adminDataController.js";

export const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(requireAuth, requireRole("admin"));

// ─── Dashboard ───────────────────────────────────────────────────
adminRouter.get("/dashboard", asyncHandler(adminDataController.getDashboard));

// ─── User Management ─────────────────────────────────────────────
adminRouter.get("/users", asyncHandler(adminUserController.listUsers));
adminRouter.post("/users", asyncHandler(adminUserController.createUser));
adminRouter.get("/users/:userId", asyncHandler(adminUserController.getUser));
adminRouter.patch("/users/:userId", asyncHandler(adminUserController.updateUser));
adminRouter.delete("/users/:userId", asyncHandler(adminUserController.deleteUser));

// ─── User Data Browsing ──────────────────────────────────────────
adminRouter.get("/users/:userId/contracts", asyncHandler(adminDataController.getUserContracts));
adminRouter.get("/users/:userId/invoices", asyncHandler(adminDataController.getUserInvoices));
adminRouter.get("/users/:userId/repair-orders", asyncHandler(adminDataController.getUserRepairOrders));

// ─── Document Access ──────────────────────────────────────────────
adminRouter.get("/contracts/:id/pdf", asyncHandler(adminDataController.getContractPdf));
adminRouter.get("/invoices/:id/pdf", asyncHandler(adminDataController.getInvoicePdf));
adminRouter.get("/repair-orders/:id/pdf", asyncHandler(adminDataController.getRepairOrderPdf));
