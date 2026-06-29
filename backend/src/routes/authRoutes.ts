import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import {
  authMeLimiter,
  loginLimiter,
  logoutLimiter,
  signupLimiter
} from "../middlewares/rateLimiters.js";

export const authRouter = Router();

// Each endpoint uses its own dedicated limiter. The router is mounted WITHOUT a
// shared limiter in app.ts so no auth route is rate-limited more than once.
authRouter.post("/signup", signupLimiter, asyncHandler(authController.signup));
authRouter.post("/login", loginLimiter, asyncHandler(authController.login));
authRouter.post("/logout", logoutLimiter, requireAuth, asyncHandler(authController.logout));
authRouter.get("/me", authMeLimiter, requireAuth, asyncHandler(authController.me));
authRouter.get("/employees", authMeLimiter, requireAuth, asyncHandler(authController.listEmployees));

