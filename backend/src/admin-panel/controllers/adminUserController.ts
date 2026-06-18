import type { Request, Response } from "express";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from "../validators/adminValidators.js";
import * as adminUserService from "../services/adminUserService.js";

export const listUsers = async (req: Request, res: Response) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await adminUserService.listUsers(query);
  res.json(result);
};

export const getUser = async (req: Request, res: Response) => {
  const user = await adminUserService.getUserById(req.params.userId as string);
  res.json({ user });
};

export const createUser = async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await adminUserService.createUser(data);
  res.status(201).json({ user });
};

export const updateUser = async (req: Request, res: Response) => {
  const data = updateUserSchema.parse(req.body);
  const user = await adminUserService.updateUser(
    req.params.userId as string,
    req.user!.id,
    data
  );
  res.json({ user });
};

export const deleteUser = async (req: Request, res: Response) => {
  const result = await adminUserService.deleteUser(
    req.params.userId as string,
    req.user!.id
  );
  res.json(result);
};
