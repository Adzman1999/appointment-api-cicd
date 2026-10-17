import { Router } from "express";

import {
  createAppointment,
  deleteAppointment,
} from "../controllers/appointment.controller.js";

import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.post("/", createAppointment);
router.delete("/:id", deleteAppointment);

export default router;