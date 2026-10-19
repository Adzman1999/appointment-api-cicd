
import { Router } from "express";
import {
  createAppointment,
  deleteAppointment,
  listMyAppointments,
} from "../controllers/appointment.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  appointmentIdParamsSchema,
  bookAppointmentSchema,
} from "../validation/appointment.schemas.js";
import {
  validateBody,
  validateParams,
} from "../validation/validate.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  listMyAppointments,
);

router.post(
  "/",
  validateBody(bookAppointmentSchema),
   createAppointment,
);

router.delete(
  "/:id",
  validateParams(appointmentIdParamsSchema),
  deleteAppointment,
);

export default router;

