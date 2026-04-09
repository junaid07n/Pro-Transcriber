import { Router } from "express";
import healthRouter from "./health.js";
import transcribeRouter from "./transcribe.js";

const router = Router();

router.use("/", healthRouter);
router.use("/transcribe", transcribeRouter);

export default router;
