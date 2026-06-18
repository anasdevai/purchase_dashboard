import type { Request, Response } from "express";
import * as adminUserService from "../services/adminUserService.js";
import * as adminDashboardService from "../services/adminDashboardService.js";
import { prisma } from "../../config/prisma.js";
import { HttpError } from "../../utils/httpError.js";
import { toAbsolutePath } from "../../utils/paths.js";
import { renderInvoicePdfBuffer } from "../../services/pdfService.js";
import { shopSettingsToPdf, getShopSettingsForUser } from "../../services/settingsService.js";

export const getDashboard = async (_req: Request, res: Response) => {
  const dashboard = await adminDashboardService.getGlobalDashboard();
  res.json(dashboard);
};

export const getUserContracts = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminUserService.getUserContracts(
    req.params.userId as string,
    page,
    limit
  );
  res.json(result);
};

export const getUserInvoices = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminUserService.getUserInvoices(
    req.params.userId as string,
    page,
    limit
  );
  res.json(result);
};

export const getUserRepairOrders = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await adminUserService.getUserRepairOrders(
    req.params.userId as string,
    page,
    limit
  );
  res.json(result);
};

export const getContractPdf = async (req: Request, res: Response) => {
  const contract = await prisma.contract.findUnique({
    where: { id: req.params.id as string }
  });

  if (!contract) {
    throw new HttpError(404, "Contract not found");
  }

  if (!contract.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this contract");
  }

  res.sendFile(toAbsolutePath(contract.pdfPath));
};

export const getInvoicePdf = async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id as string },
    include: { items: { orderBy: { sortOrder: "asc" } } }
  });

  if (!invoice) {
    throw new HttpError(404, "Invoice not found");
  }

  const richSettings = await getShopSettingsForUser(invoice.userId);
  const pdfBuffer = await renderInvoicePdfBuffer(invoice as any, shopSettingsToPdf(richSettings), "de");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
  res.send(pdfBuffer);
};

export const getRepairOrderPdf = async (req: Request, res: Response) => {
  const repairOrder = await prisma.repairOrder.findUnique({
    where: { id: req.params.id as string }
  });

  if (!repairOrder) {
    throw new HttpError(404, "Repair order not found");
  }

  if (!repairOrder.pdfPath) {
    throw new HttpError(404, "PDF has not been generated for this repair order");
  }

  res.sendFile(toAbsolutePath(repairOrder.pdfPath));
};
