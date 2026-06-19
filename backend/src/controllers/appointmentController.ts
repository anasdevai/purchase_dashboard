import type { Request, Response } from "express";
import * as appointmentService from "../services/appointmentService.js";

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
