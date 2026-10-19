import express from "express";
import helmet from "helmet";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

//routes
import appointmentRoutes from "./routes/appointment.routes.js";
import authRoutes from "./routes/auth.routes.js";
import slotRoutes from "./routes/slot.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/slots", slotRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;