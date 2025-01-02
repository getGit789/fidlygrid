import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Pencil, Smile, Star, Trash, ArrowUpFromLine } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MicrophoneButton } from "./MicrophoneButton";
import EmojiPicker from "./EmojiPicker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  category: string;
  createdAt: string;
  favorite: boolean;
  deleted: boolean;
  emoji: string;
}

interface TaskListProps {
  category: string;
  showEmptyState?: boolean;
  showInput?: boolean;
}

export default function TaskList({ 
  category,
  showEmptyState = true,
  showInput = true 
}: TaskListProps) {
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { triggerConfetti } = useConfetti();
  const { toast } = useToast();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const { theme } = useTheme();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTask = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title,
          category: "Tasks",
          completed: false,
          favorite: false,
          deleted: false,
          emoji: selectedEmoji || "😀"
        }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTask("");
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, category: "Tasks" }),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.updates.completed) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditingTask(null);
      setEditedTitle("");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tasks/${id}/permanent`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to permanently delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task permanently deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to permanently delete task",
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = async (title: string) => {
    if (!title.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          emoji: selectedEmoji || "😀",
          completed: false,
          favorite: false,
          deleted: false,
          category: category,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setNewTask("");
      setSelectedEmoji(null);  
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task.id);
    setEditedTitle(`${task.emoji} ${task.title}`);
  };

  const handleSaveEdit = (id: number) => {
    if (editedTitle.trim()) {
      const currentTask = tasks.find(t => t.id === id);
      if (!currentTask) return;
      
      updateTask.mutate({
        id,
        updates: { 
          title: editedTitle.trim(),
          emoji: currentTask.emoji
        },
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const newText = newTask.slice(0, start) + emoji + newTask.slice(end);
      setNewTask(newText);
      // Set cursor position after emoji
      setTimeout(() => {
        inputRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleTranscript = (text: string) => {
    if (text.trim()) {
      setNewTask(text.trim());
    }
  };

  console.log('All tasks:', tasks);
  console.log('Current category:', category);

  const filteredTasks = tasks.filter((task) => {
    if (category === "Favorites") {
      return task.favorite && !task.deleted;
    }
    if (category === "Trash") {
      return task.deleted;
    }
    const shouldShow = !task.deleted && task.category === "Tasks";
    console.log('Task:', task, 'Should show:', shouldShow);
    return shouldShow;
  });

  console.log('Filtered tasks:', filteredTasks);

  return (
    <div className="space-y-4">
      {(category === "My Tasks" || category === "Tasks") && showInput && (
        <Card style={{ background: 'var(--card-bg)' }}>
          <CardContent className="pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTask(newTask);
              }}
              className="flex items-center space-x-2"
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10" style={{ background: 'var(--button-bg)' }}>
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent style={{ background: 'var(--popover-bg)' }}>
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </PopoverContent>
              </Popover>
              <Input
                ref={inputRef}
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a new task..."
                className="flex-1 h-10 border border-input"
                style={{ 
                  background: 'var(--input-bg)',
                  borderColor: theme === 'dark' ? '#27272A' : undefined
                }}
              />
              <MicrophoneButton onTranscript={handleTranscript} style={{ background: 'var(--button-bg)' }} />
              <Button type="submit" size="sm">
                Add
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {filteredTasks.map((task) => (
        <Card key={task.id} style={{ background: 'var(--card-bg)' }} className="min-h-[76px]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id={task.id.toString()}
                checked={task.completed}
                onCheckedChange={() => updateTask.mutate({
                  id: task.id,
                  updates: { completed: !task.completed },
                })}
              />
              <div className="flex-1 min-w-0">
                {editingTask === task.id ? (
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" style={{ background: 'var(--button-bg)' }}>
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent style={{ background: 'var(--popover-bg)' }}>
                        <EmojiPicker onEmojiSelect={(emoji) => {
                          setEditedTitle(editedTitle + emoji);
                        }} />
                      </PopoverContent>
                    </Popover>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="h-8"
                      style={{ background: 'var(--input-bg)' }}
                      autoFocus
                    />
                    <Button onClick={() => handleSaveEdit(task.id)} size="sm">
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingTask(null)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className={cn(
                      "flex-1 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      task.completed && "text-muted-foreground line-through"
                    )}>
                      {task.emoji} {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(task.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
              {!editingTask && (
                <div className="flex gap-2">
                  {category === "Trash" ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateTask.mutate({
                          id: task.id,
                          updates: { deleted: false },
                        })}
                        className="h-8 w-8"
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask.mutate(task.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTask(task.id)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateTask.mutate({
                          id: task.id,
                          updates: { favorite: !task.favorite },
                        })}
                        className="h-8 w-8"
                      >
                        <Star className={cn("h-4 w-4", task.favorite ? "fill-yellow-400 text-yellow-400" : "")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateTask.mutate({
                          id: task.id,
                          updates: { deleted: true },
                        })}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredTasks.length === 0 && showEmptyState && (
        <div className="text-center text-sm text-muted-foreground">
          {category === "Favorites" && "You don't have any favorites yet"}
          {category === "Trash" && "Trash can is empty"}
          {category === "My Tasks" && "You don't have any tasks yet"}
        </div>
      )}
    </div>
  );
}