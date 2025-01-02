import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FileIcon, Trash2, Download, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploader from "./FileUploader";
import FileDetailDialog from "./FileDetailDialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface File {
  id: number;
  name: string;
  type: string;
  createdAt: string;
}

export default function Files() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: files = [] } = useQuery<File[]>({
    queryKey: ["/api/files"],
  });

  const deleteFile = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handlePreview = async (id: number, type: string) => {
    try {
      const res = await fetch(`/api/files/${id}/content`);
      if (!res.ok) throw new Error("Failed to fetch file content");

      if (type === "text") {
        const text = await res.text();
        const win = window.open("", "_blank");
        win?.document.write(`
          <html>
            <head>
              <title>File Preview</title>
              <style>
                body { 
                  font-family: monospace;
                  padding: 20px;
                  white-space: pre-wrap;
                }
              </style>
            </head>
            <body>${text}</body>
          </html>
        `);
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = files.find(f => f.id === id)?.name || 'download.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      });
    }
  };

  // Group files by type
  const pdfFiles = files.filter(f => f.type === "pdf");
  const textFiles = files.filter(f => f.type === "text");

  const FileGroup = ({ title, files, icon: Icon }: { title: string, files: File[], icon: typeof FileIcon }) => (
    <div className="space-y-2">
      {files.length > 0 && (
        <>
          <h3 className="font-medium text-sm text-muted-foreground mb-3">{title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {files.map((file) => (
              <Card key={file.id} className="hover:bg-accent/5 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(file.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePreview(file.id, file.type)}
                      title={file.type === "pdf" ? "Download" : "Preview"}
                    >
                      {file.type === "pdf" ? (
                        <Download className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(file)}
                      title="Comments & Sharing"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile.mutate(file.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <FileUploader />

      <div className="space-y-6">
        <FileGroup title="PDF Files" files={pdfFiles} icon={FileIcon} />
        <FileGroup title="Text Files" files={textFiles} icon={FileText} />
      </div>

      {files.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-8">
          No files uploaded yet
        </div>
      )}

      {selectedFile && (
        <FileDetailDialog
          fileId={selectedFile.id}
          fileName={selectedFile.name}
          isOpen={true}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}