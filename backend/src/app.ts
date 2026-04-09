import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { globalLimiter } from "./lib/rateLimiter.js";
import router from "./routes/index.js";

const app: Express = express();

app.use(helmet());
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? (process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [])
    : null;

app.use(
  cors({
    origin: allowedOrigins === null
      ? true
      : allowedOrigins.length > 0
        ? allowedOrigins
        : false,
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
