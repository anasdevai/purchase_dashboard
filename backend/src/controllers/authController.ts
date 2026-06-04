import type { Request, Response } from "express";
import { loginSchema, signupSchema } from "../validators/authValidators.js";
import * as authService from "../services/authService.js";

export const signup = async (req: Request, res: Response) => {
  const result = await authService.signup(signupSchema.parse(req.body));
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response) => {
  const result = await authService.login(loginSchema.parse(req.body));
  res.json(result);
};

export const me = async (req: Request, res: Response) => {
  res.json({ user: req.user });
};

