import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (url.pathname.startsWith("/embed/")) {
      const id = url.pathname.split("/")[2];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {
    // Not a valid URL
  }

  return null;
}

export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    const list = url.searchParams.get("list");
    if (list) return list;
  } catch {
    // Not a valid URL - try as direct ID
    if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed) && !/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^PL[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;
  }

  return null;
}

export interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

export interface TranscribeResult {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  method: "manual" | "auto" | "unavailable";
  language: string;
  segments: TranscriptSegment[];
  transcriptText: string;
  transcriptSrt: string;
}

function buildSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.start + seg.duration);
      return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}\n`;
    })
    .join("\n");
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export async function fetchTranscript(
  videoId: string,
  preferredLanguages?: string[]
): Promise<TranscribeResult> {
  let title = "Unknown Title";
  let channelName = "Unknown Channel";
  let duration = 0;
  let thumbnailUrl: string | null = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (oembedRes.ok) {
      const oembed = (await oembedRes.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      title = oembed.title ?? title;
      channelName = oembed.author_name ?? channelName;
      thumbnailUrl = oembed.thumbnail_url ?? thumbnailUrl;
    }
  } catch {
    // Non-fatal, use defaults
  }

  try {
    const langs =
      preferredLanguages && preferredLanguages.length > 0
        ? preferredLanguages
        : ["en"];

    let transcriptItems: { text: string; duration: number; offset: number }[] = [];
    let language = langs[0];
    let method: "manual" | "auto" = "manual";

    let fetched = false;
    for (const lang of langs) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        language = lang;
        fetched = true;
        break;
      } catch {
        // Try next language
      }
    }

    if (!fetched) {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        method = "auto";
        language = "auto";
        fetched = true;
      } catch {
        // No transcript available
      }
    }

    if (!fetched || transcriptItems.length === 0) {
      return {
        videoId,
        title,
        channelName,
        duration,
        thumbnailUrl,
        method: "unavailable",
        language: "none",
        segments: [],
        transcriptText: "",
        transcriptSrt: "",
      };
    }

    // youtube-transcript returns offset in seconds (not ms)
    const segments: TranscriptSegment[] = transcriptItems.map((item) => ({
      start: item.offset,
      duration: item.duration,
      text: item.text,
    }));

    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      duration = Math.round(last.start + last.duration);
    }

    const transcriptText = segments.map((s) => s.text).join(" ");
    const transcriptSrt = buildSrt(segments);

    return {
      videoId,
      title,
      channelName,
      duration,
      thumbnailUrl,
      method,
      language,
      segments,
      transcriptText,
      transcriptSrt,
    };
  } catch {
    return {
      videoId,
      title,
      channelName,
      duration,
      thumbnailUrl,
      method: "unavailable",
      language: "none",
      segments: [],
      transcriptText: "",
      transcriptSrt: "",
    };
  }
}

export interface PlaylistVideoItem {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  position: number;
}

export interface PlaylistInfo {
  playlistId: string;
  title: string;
  channelName: string;
  videoCount: number;
  videos: PlaylistVideoItem[];
}

export async function fetchPlaylistInfo(playlistId: string): Promise<PlaylistInfo> {
  const response = await fetch(
    `https://www.youtube.com/playlist?list=${playlistId}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: HTTP ${response.status}`);
  }

  const html = await response.text();

  const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!match) {
    throw new Error("Could not find playlist data in YouTube response");
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    throw new Error("Failed to parse playlist data");
  }

  try {
    const sidebar = (data as any).sidebar?.playlistSidebarRenderer?.items;
    const primaryInfo = sidebar?.[0]?.playlistSidebarPrimaryInfoRenderer;
    const secondaryInfo = sidebar?.[1]?.playlistSidebarSecondaryInfoRenderer;

    const playlistTitle =
      primaryInfo?.title?.runs?.[0]?.text ?? "Unknown Playlist";
    const channelName =
      secondaryInfo?.videoOwner?.videoOwnerRenderer?.title?.runs?.[0]?.text ??
      primaryInfo?.stats?.[1]?.runs?.[0]?.text ??
      "Unknown Channel";

    const contents =
      (data as any).contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
        ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer
        ?.contents ?? [];

    const videos: PlaylistVideoItem[] = [];
    for (let i = 0; i < contents.length; i++) {
      const item = contents[i]?.playlistVideoRenderer;
      if (!item) continue;

      const videoId = item.videoId;
      if (!videoId) continue;

      const videoTitle = item.title?.runs?.[0]?.text ?? "Unknown";
      const lengthText = item.lengthText?.simpleText ?? "0:00";
      const thumbs = item.thumbnail?.thumbnails ?? [];
      const thumbUrl =
        thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url ?? null : null;

      const durationSecs = parseDuration(lengthText);

      videos.push({
        videoId,
        title: videoTitle,
        channelName,
        duration: durationSecs,
        thumbnailUrl: thumbUrl,
        position: i + 1,
      });
    }

    return {
      playlistId,
      title: playlistTitle,
      channelName,
      videoCount: videos.length,
      videos,
    };
  } catch (err) {
    throw new Error(`Failed to parse playlist structure: ${String(err)}`);
  }
}

function parseDuration(text: string): number {
  const parts = text.split(":").map(Number).reverse();
  let seconds = 0;
  if (parts[0]) seconds += parts[0];
  if (parts[1]) seconds += parts[1] * 60;
  if (parts[2]) seconds += parts[2] * 3600;
  return seconds;
}
