import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export default function FileUploader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null);

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 10MB");
      }

      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          type: file.type.includes("pdf") ? "pdf" : "text",
          content,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to upload file");
      }

      return res.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["text/plain", "application/pdf"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only text and PDF files are supported",
        variant: "destructive",
      });
      return;
    }

    await uploadFile.mutate(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="flex justify-center">
      <input
        type="file"
        accept=".txt,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        ref={(el) => (fileInputRef[1](el))}
      />
      <Button 
        variant="outline"
        size="lg"
        className="w-full bg-primary/10 hover:bg-primary/20 border-none"
        onClick={() => fileInputRef[0]?.click()}
        disabled={isLoading}
      >
        <Plus className={`h-6 w-6 text-primary ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}