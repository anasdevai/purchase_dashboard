import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", appointmentController.list);
router.post("/", appointmentController.create);
router.get("/export", appointmentController.exportData);
router.get("/:id", appointmentController.getDetails);
router.put("/:id", appointmentController.update);
router.patch("/:id/move", appointmentController.move);
router.delete("/:id", appointmentController.remove);
router.post("/:id/reminder", appointmentController.sendReminder);

export default router;
