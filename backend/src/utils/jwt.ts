import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  userId: string;
};

export const signAuthToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "1h"
  });

export const verifyAuthToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as JwtPayload;

