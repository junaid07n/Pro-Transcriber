import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { List, Loader2, AlertCircle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { formatDuration } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PlaylistVideoItem {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  position: number;
}

interface PlaylistInfo {
  playlistId: string;
  title: string;
  channelName: string;
  videoCount: number;
  videos: PlaylistVideoItem[];
}

interface TranscribeResult {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  method: "manual" | "auto" | "unavailable";
  language: string;
  segments: Array<{ start: number; duration: number; text: string }>;
  transcriptText: string;
  transcriptSrt: string;
}

interface PlaylistVideoTranscribeResult {
  videoId: string;
  title: string;
  position: number;
  success: boolean;
  result?: TranscribeResult;
  error: string | null;
}

interface PlaylistTranscribeResult {
  playlistId: string;
  playlistTitle: string;
  totalVideos: number;
  successCount: number;
  failureCount: number;
  results: PlaylistVideoTranscribeResult[];
}

async function fetchPlaylistInfo(url: string): Promise<PlaylistInfo> {
  const res = await fetch("/api/transcribe/playlist/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Failed to fetch playlist info");
  }
  return res.json();
}

async function transcribePlaylist(url: string, maxVideos?: number): Promise<PlaylistTranscribeResult> {
  const res = await fetch("/api/transcribe/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, maxVideos }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Failed to transcribe playlist");
  }
  return res.json();
}

function VideoResultItem({ item }: { item: PlaylistVideoTranscribeResult }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm text-muted-foreground w-6">{item.position}.</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          {!item.success && item.error && (
            <p className="text-xs text-destructive">{item.error}</p>
          )}
        </div>
        <Badge variant={item.success ? "default" : "destructive"}>
          {item.success ? "OK" : "Failed"}
        </Badge>
        {item.success && item.result && (
          expanded ? <ChevronUp className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />
        )}
      </button>
      {expanded && item.success && item.result && (
        <div className="p-4 border-t">
          <TranscriptViewer {...item.result} />
        </div>
      )}
    </div>
  );
}

export default function Playlist() {
  const [url, setUrl] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [transcribeResult, setTranscribeResult] = useState<PlaylistTranscribeResult | null>(null);

  const infoMutation = useMutation({
    mutationFn: fetchPlaylistInfo,
    onSuccess: (data) => {
      setPlaylistInfo(data);
      setTranscribeResult(null);
      toast({ title: "Playlist loaded!", description: `${data.videoCount} videos found` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Limit to first 50 videos per request (matches backend max) to avoid long-running operations
  const MAX_VIDEOS = 50;
  const transcribeMutation = useMutation({
    mutationFn: (u: string) => transcribePlaylist(u, MAX_VIDEOS),
    onSuccess: (data) => {
      setTranscribeResult(data);
      toast({
        title: "Transcription complete!",
        description: `${data.successCount}/${data.totalVideos} videos transcribed`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleGetInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setPlaylistInfo(null);
    setTranscribeResult(null);
    infoMutation.mutate(url.trim());
  };

  const handleTranscribeAll = () => {
    if (!url.trim()) return;
    transcribeMutation.mutate(url.trim());
  };

  const isLoading = infoMutation.isPending || transcribeMutation.isPending;
  const progress = transcribeMutation.isPending ? undefined : transcribeResult
    ? (transcribeResult.successCount + transcribeResult.failureCount) / transcribeResult.totalVideos * 100
    : undefined;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <List className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Playlist Transcriber</h1>
          <p className="text-muted-foreground">
            Transcribe all videos in a YouTube playlist at once.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Playlist URL</CardTitle>
            <CardDescription>Enter a YouTube playlist URL or playlist ID.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGetInfo} className="flex gap-2">
              <Input
                placeholder="https://www.youtube.com/playlist?list=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !url.trim()}>
                {infoMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <List className="w-4 h-4" />
                )}
                Get Info
              </Button>
            </form>
          </CardContent>
        </Card>

        {(infoMutation.isError || transcribeMutation.isError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {infoMutation.error?.message ?? transcribeMutation.error?.message}
            </AlertDescription>
          </Alert>
        )}

        {playlistInfo && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{playlistInfo.title}</CardTitle>
                  <CardDescription>{playlistInfo.channelName} • {playlistInfo.videoCount} videos</CardDescription>
                </div>
                <Button
                  onClick={handleTranscribeAll}
                  disabled={transcribeMutation.isPending}
                >
                  {transcribeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Transcribe All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {transcribeMutation.isPending && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Transcribing videos...</p>
                  <Progress value={undefined} className="animate-pulse" />
                </div>
              )}
              {progress !== undefined && !transcribeMutation.isPending && transcribeResult && (
                <div className="flex gap-2">
                  <Badge variant="default">{transcribeResult.successCount} success</Badge>
                  {transcribeResult.failureCount > 0 && (
                    <Badge variant="destructive">{transcribeResult.failureCount} failed</Badge>
                  )}
                </div>
              )}
              {!transcribeResult && playlistInfo.videos.map((video) => (
                <div key={video.videoId} className="flex gap-3 items-center border rounded-md p-3">
                  {video.thumbnailUrl && (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-10 object-cover rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDuration(video.duration)}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{video.position}</span>
                </div>
              ))}
              {transcribeResult && transcribeResult.results.map((item) => (
                <VideoResultItem key={item.videoId} item={item} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
