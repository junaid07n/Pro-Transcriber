import { useState } from "react";
import { Copy, Download, CheckCheck, FileText, Code, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { copyToClipboard, downloadFile, formatDuration, sanitizeFilename } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface TranscriptSegment {
  start: number;
  duration: number;
  text: string;
}

interface TranscriptViewerProps {
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  thumbnailUrl: string | null;
  language: string;
  method: string;
  transcriptText: string;
  transcriptSrt: string;
  segments: TranscriptSegment[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TranscriptViewer({
  videoId,
  title,
  channelName,
  duration,
  thumbnailUrl,
  language,
  method,
  transcriptText,
  transcriptSrt,
  segments,
}: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

  const safeFilename = sanitizeFilename(title);

  const handleCopy = async () => {
    const content = activeTab === "srt" ? transcriptSrt : transcriptText;
    await copyToClipboard(content);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    downloadFile(transcriptText, `${safeFilename}.txt`, "text/plain");
  };

  const handleDownloadSrt = () => {
    downloadFile(transcriptSrt, `${safeFilename}.srt`, "text/plain");
  };

  const handleDownloadJson = () => {
    const data = {
      videoId,
      title,
      channelName,
      duration,
      language,
      method,
      segments,
    };
    downloadFile(JSON.stringify(data, null, 2), `${safeFilename}.json`, "application/json");
  };

  const methodBadgeVariant = method === "unavailable" ? "destructive" : "default";
  const methodLabel = method === "manual" ? "Manual CC" : method === "auto" ? "Auto-generated" : "Unavailable";

  return (
    <div className="space-y-4">
      {/* Video metadata */}
      <div className="flex gap-4 items-start">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-32 h-20 object-cover rounded-md flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg leading-tight truncate">{title}</h2>
          <p className="text-muted-foreground text-sm">{channelName}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{formatDuration(duration)}</Badge>
            <Badge variant="secondary">{language}</Badge>
            <Badge variant={methodBadgeVariant}>{methodLabel}</Badge>
          </div>
        </div>
      </div>

      {method === "unavailable" ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          No transcript available for this video.
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
              <FileText className="w-4 h-4" />
              TXT
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadSrt}>
              <Code className="w-4 h-4" />
              SRT
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadJson}>
              <Download className="w-4 h-4" />
              JSON
            </Button>
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="text">
                <FileText className="w-4 h-4 mr-1" />
                Text
              </TabsTrigger>
              <TabsTrigger value="srt">
                <Code className="w-4 h-4 mr-1" />
                SRT
              </TabsTrigger>
              <TabsTrigger value="segments">
                <List className="w-4 h-4 mr-1" />
                Segments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <ScrollArea className="h-64 rounded-md border p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{transcriptText}</p>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="srt">
              <ScrollArea className="h-64 rounded-md border p-4">
                <pre className="text-xs leading-relaxed font-mono">{transcriptSrt}</pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="segments">
              <ScrollArea className="h-64 rounded-md border">
                <div className="divide-y">
                  {segments.map((seg, i) => (
                    <div key={i} className="flex gap-3 p-3 hover:bg-muted/50">
                      <span className="text-xs text-muted-foreground font-mono w-16 flex-shrink-0 pt-0.5">
                        {formatTime(seg.start)}
                      </span>
                      <span className="text-sm">{seg.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
