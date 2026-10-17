import { z } from "zod";

export const bookAppointmentSchema = z
  .object({
    slotId: z.number().int().positive(),
  })
  .strict();

export const appointmentIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "ID must be a positive integer")
    .refine(
      (value) => Number.isSafeInteger(Number(value)),
      "ID is outside the safe integer range",
    ),
});
