import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Share, MessageSquare, Send } from "lucide-react";

interface FileDetailDialogProps {
  fileId: number | null;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface ShareInfo {
  id: number;
  sharedWith: string;
  permission: string;
  createdAt: string;
}

export default function FileDetailDialog({ fileId, fileName, isOpen, onClose }: FileDetailDialogProps) {
  const [newComment, setNewComment] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/files/${fileId}/comments`],
    enabled: isOpen && fileId !== null,
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/files/${fileId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          author: "Current User", // Placeholder for now
        }),
      });

      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/comments`] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const shareFile = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharedWith: shareEmail,
          permission: "read",
        }),
      });

      if (!res.ok) throw new Error("Failed to share file");
      return res.json();
    },
    onSuccess: () => {
      setShareEmail("");
      toast({
        title: "Success",
        description: "File shared successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share file",
        variant: "destructive",
      });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment.mutate();
    }
  };

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareEmail.trim()) {
      shareFile.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </TabsTrigger>
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No comments yet
                </p>
              )}

              <form onSubmit={handleAddComment} className="flex gap-2 mt-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="share">
            <div className="space-y-4">
              <form onSubmit={handleShare} className="flex gap-2">
                <Input
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email to share with..."
                  type="email"
                  className="flex-1"
                />
                <Button type="submit">Share</Button>
              </form>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Shared with:</h3>
                <p className="text-center text-sm text-muted-foreground py-4">
                  This file hasn't been shared with anyone
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}