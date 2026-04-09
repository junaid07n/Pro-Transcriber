import { useState } from "react";
import { Clock, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { useHistory, type HistoryItem } from "@/hooks/useHistory";
import { formatDuration } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function History() {
  const { history, clearHistory, removeItem } = useHistory();
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  const handleClear = () => {
    clearHistory();
    setSelected(null);
    toast({ title: "History cleared" });
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(id);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-6 h-6" />
              History
            </h1>
            <p className="text-muted-foreground text-sm">
              Your past transcriptions ({history.length})
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <Clock className="w-12 h-12 text-muted-foreground opacity-50" />
              <div>
                <p className="font-medium">No transcription history yet</p>
                <p className="text-sm text-muted-foreground">
                  Transcribed videos will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelected(selected?.id === item.id ? null : item)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-20 h-14 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.channelName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="secondary" className="text-xs">{formatDuration(item.duration)}</Badge>
                        <Badge variant="secondary" className="text-xs">{item.language}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {new Date(item.savedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 h-7 w-7"
                      onClick={(e) => handleRemove(item.id, e)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {selected?.id === item.id && (
                    <div className="mt-4 pt-4 border-t">
                      <TranscriptViewer {...item} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
