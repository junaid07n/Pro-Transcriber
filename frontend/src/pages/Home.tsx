import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, AlertCircle, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Layout } from "@/components/Layout";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { useHistory } from "@/hooks/useHistory";
import { toast } from "@/hooks/use-toast";

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

async function transcribeVideo(url: string): Promise<TranscribeResult> {
  const res = await fetch("/api/transcribe/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? "Failed to transcribe video");
  }
  return res.json();
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const { addToHistory } = useHistory();

  const mutation = useMutation({
    mutationFn: transcribeVideo,
    onSuccess: (data) => {
      setResult(data);
      if (data.method !== "unavailable") {
        addToHistory(data);
        toast({ title: "Transcript fetched!", description: data.title });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setResult(null);
    mutation.mutate(url.trim());
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Youtube className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold">YouTube Transcript Extractor</h1>
          <p className="text-muted-foreground">
            Get transcripts from any YouTube video instantly, for free.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transcribe a Video</CardTitle>
            <CardDescription>
              Paste a YouTube video URL or video ID below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={mutation.isPending}
                className="flex-1"
              />
              <Button type="submit" disabled={mutation.isPending || !url.trim()}>
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {mutation.isPending ? "Loading..." : "Transcribe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {mutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Card>
            <CardContent className="pt-6">
              <TranscriptViewer {...result} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
