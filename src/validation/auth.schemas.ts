import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(12).max(72),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(72),
  })
  .strict();
