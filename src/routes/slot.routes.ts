import { Router } from "express";
import {
  holdSlotController,
  listSlots,
  releaseSlotHoldController,
} from "../controllers/slot.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// List all slots (can be accessed with optional auth to identify my holds)
router.get("/", (req, res, next) => {
  // If authorization header is present, attempt authentication, otherwise continue as guest
  if (req.headers.authorization) {
    return authenticate(req, res, () => listSlots(req, res, next));
  }
  return listSlots(req, res, next);
});

// Hold a slot for 3 minutes (requires login)
router.post("/:id/hold", authenticate, holdSlotController);

// Release a hold early (requires login)
router.post("/:id/release", authenticate, releaseSlotHoldController);

export default router;
