import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import { globalLimiter } from "./lib/rateLimiter.js";
import router from "./routes/index.js";

const app: Express = express();

app.use(helmet());
// In development, allow all origins. In production, restrict to ALLOWED_ORIGINS.
const corsOrigin: cors.CorsOptions["origin"] =
  process.env.NODE_ENV === "production"
    ? (() => {
        const origins = (process.env.ALLOWED_ORIGINS ?? "")
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
        return origins.length > 0 ? origins : false;
      })()
    : (_origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => cb(null, true);

app.use(cors({ origin: corsOrigin, credentials: true }));
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
