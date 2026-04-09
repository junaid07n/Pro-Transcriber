import app from "./app.js";
import { logger } from "./lib/logger.js";

const port = Number(process.env.PORT ?? 8080);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
