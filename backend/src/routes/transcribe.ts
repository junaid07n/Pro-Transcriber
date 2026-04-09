import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  extractVideoId,
  extractPlaylistId,
  fetchTranscript,
  fetchPlaylistInfo,
} from "../lib/youtube.js";
import { transcribeLimiter } from "../lib/rateLimiter.js";
import { logger } from "../lib/logger.js";

const router = Router();

const VideoRequestSchema = z.object({
  url: z.string().min(1),
  preferredLanguages: z.array(z.string()).optional(),
  includeTimestamps: z.boolean().optional(),
});

const PlaylistRequestSchema = z.object({
  url: z.string().min(1),
  preferredLanguages: z.array(z.string()).optional(),
  maxVideos: z.number().int().positive().max(50).optional(),
});

const PlaylistInfoRequestSchema = z.object({
  url: z.string().min(1),
});

router.post("/video", transcribeLimiter, async (req: Request, res: Response) => {
  const parsed = VideoRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { url, preferredLanguages } = parsed.data;
  const videoId = extractVideoId(url);

  if (!videoId) {
    res.status(400).json({ error: "Could not extract video ID from the provided URL" });
    return;
  }

  logger.info({ videoId }, "Transcribing video");

  try {
    const result = await fetchTranscript(videoId, preferredLanguages);
    res.json(result);
  } catch (err) {
    logger.error({ err, videoId }, "Error transcribing video");
    res.status(500).json({ error: "Failed to transcribe video" });
  }
});

router.post("/playlist/info", transcribeLimiter, async (req: Request, res: Response) => {
  const parsed = PlaylistInfoRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { url } = parsed.data;
  const playlistId = extractPlaylistId(url);

  if (!playlistId) {
    res.status(400).json({ error: "Could not extract playlist ID from the provided URL" });
    return;
  }

  logger.info({ playlistId }, "Fetching playlist info");

  try {
    const info = await fetchPlaylistInfo(playlistId);
    res.json(info);
  } catch (err) {
    logger.error({ err, playlistId }, "Error fetching playlist info");
    res.status(500).json({ error: `Failed to fetch playlist info: ${err instanceof Error ? err.message : String(err)}` });
  }
});

router.post("/playlist", transcribeLimiter, async (req: Request, res: Response) => {
  const parsed = PlaylistRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { url, preferredLanguages, maxVideos } = parsed.data;
  const playlistId = extractPlaylistId(url);

  if (!playlistId) {
    res.status(400).json({ error: "Could not extract playlist ID from the provided URL" });
    return;
  }

  logger.info({ playlistId }, "Transcribing playlist");

  try {
    const playlistInfo = await fetchPlaylistInfo(playlistId);
    const videosToProcess = maxVideos
      ? playlistInfo.videos.slice(0, maxVideos)
      : playlistInfo.videos;

    const results = await Promise.allSettled(
      videosToProcess.map(async (video) => {
        try {
          const result = await fetchTranscript(video.videoId, preferredLanguages);
          return {
            videoId: video.videoId,
            title: video.title,
            position: video.position,
            success: true,
            result,
            error: null,
          };
        } catch (err) {
          return {
            videoId: video.videoId,
            title: video.title,
            position: video.position,
            success: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      })
    );

    const processedResults = results.map((r) =>
      r.status === "fulfilled" ? r.value : { success: false, error: String(r.reason) }
    );

    const successCount = processedResults.filter((r) => r.success).length;
    const failureCount = processedResults.filter((r) => !r.success).length;

    res.json({
      playlistId,
      playlistTitle: playlistInfo.title,
      totalVideos: videosToProcess.length,
      successCount,
      failureCount,
      results: processedResults,
    });
  } catch (err) {
    logger.error({ err, playlistId }, "Error transcribing playlist");
    res.status(500).json({ error: `Failed to transcribe playlist: ${err instanceof Error ? err.message : String(err)}` });
  }
});

export default router;
