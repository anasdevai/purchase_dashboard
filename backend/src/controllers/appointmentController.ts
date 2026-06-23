import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import * as appointmentService from "../services/appointmentService.js";
import * as googleCalendarService from "../services/googleCalendarService.js";

const userId = (req: Request) => req.user!.id;
const paramId = (req: Request) => String(req.params.id);

export const list = async (req: Request, res: Response) => {
  const start = req.query.start ? String(req.query.start) : undefined;
  const end = req.query.end ? String(req.query.end) : undefined;

  const appointments = await appointmentService.getAppointments(userId(req), start, end);
  res.json({ appointments });
};

export const getDetails = async (req: Request, res: Response) => {
  const appointment = await appointmentService.getAppointmentOrThrow(paramId(req), userId(req));
  res.json({ appointment });
};

export const create = async (req: Request, res: Response) => {
  const appointment = await appointmentService.createAppointment(userId(req), req.body);
  res.status(201).json({ appointment });
};

export const update = async (req: Request, res: Response) => {
  const appointment = await appointmentService.updateAppointment(userId(req), paramId(req), req.body);
  res.json({ appointment });
};

export const move = async (req: Request, res: Response) => {
  const appointment = await appointmentService.moveAppointment(userId(req), paramId(req), req.body);
  res.json({ appointment });
};

export const remove = async (req: Request, res: Response) => {
  const result = await appointmentService.deleteAppointment(userId(req), paramId(req));
  res.json(result);
};

export const sendReminder = async (req: Request, res: Response) => {
  const result = await appointmentService.triggerReminder(userId(req), paramId(req));
  res.json(result);
};

export const exportData = async (req: Request, res: Response) => {
  const format = String(req.query.format || "csv");
  const result = await appointmentService.exportAppointmentsData(userId(req), format);

  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.send(result.data);
};

export const getGoogleAuthUrl = async (req: Request, res: Response) => {
  const url = googleCalendarService.getAuthUrl(userId(req));
  res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code ? String(req.query.code) : undefined;
  const state = req.query.state ? String(req.query.state) : undefined;

  if (!code || !state) {
    return res.status(400).send("Auth code or state is missing");
  }

  await googleCalendarService.handleOAuthCallback(state, code);

  res.redirect(`${env.frontendUrl}/calendar?google_connected=true`);
};

export const getGoogleStatus = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: userId(req) },
    select: { googleAccessToken: true }
  });
  res.json({ connected: !!user?.googleAccessToken });
};

export const disconnectGoogle = async (req: Request, res: Response) => {
  await prisma.user.update({
    where: { id: userId(req) },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null
    }
  });
  res.json({ success: true });
};

