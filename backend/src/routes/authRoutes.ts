import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/rateLimiters.js";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(authController.signup));
authRouter.post("/login", loginLimiter, asyncHandler(authController.login));
authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
authRouter.get("/employees", requireAuth, asyncHandler(authController.listEmployees));

