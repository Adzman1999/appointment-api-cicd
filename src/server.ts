
import app from "./app.js";

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port number");
}

app.listen(port, () => {
  console.log(`Appointment API listening on port ${port}`);
});
