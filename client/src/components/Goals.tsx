import { useState, useRef } from "react"; 
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MicrophoneButton } from "./MicrophoneButton";
import EmojiPicker from "./EmojiPicker";
import { Plus, Trash2, Pencil, Star, Trash, ArrowUpFromLine } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useConfetti } from "@/hooks/useConfetti";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";

interface Goal {
  id: number;
  title: string;
  completed: boolean;
  category: string;
  createdAt: string;
  favorite: boolean;
  deleted: boolean;
}

interface GoalsProps {
  category: string;
  showEmptyState?: boolean;
  showInput?: boolean;
}

export default function Goals({ 
  category,
  showEmptyState = true,
  showInput = true 
}: GoalsProps) {
  const [newGoal, setNewGoal] = useState("");
  const [editingGoal, setEditingGoal] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { triggerConfetti } = useConfetti();
  const { toast } = useToast();
  const { theme } = useTheme();

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  console.log('All goals:', goals);
  console.log('Current category:', category);

  const filteredGoals = goals.filter((goal) => {
    if (category === "Favorites") {
      const shouldShow = goal.favorite && !goal.deleted;
      console.log('Goal:', goal, 'Show in Favorites:', shouldShow);
      return shouldShow;
    }
    if (category === "Trash") {
      const shouldShow = goal.deleted;
      console.log('Goal:', goal, 'Show in Trash:', shouldShow);
      return shouldShow;
    }
    return !goal.deleted;
  });

  console.log('Filtered goals:', filteredGoals);

  const createGoal = useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title,
          completed: false,
          favorite: false,
          deleted: false
        }),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setNewGoal("");
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Goal> }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updates, category: "Goals" }),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (variables.updates.completed) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setEditingGoal(null);
      setEditedTitle("");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/goals/${id}/permanent`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to permanently delete goal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      toast({
        title: "Success",
        description: "Goal permanently deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to permanently delete goal",
        variant: "destructive",
      });
    },
  });

  const handleCreateGoal = (text: string) => {
    if (text.trim()) {
      createGoal.mutate({ 
        title: text.trim() 
      });
    }
  };

  const handleStartEdit = (goal: Goal) => {
    setEditingGoal(goal.id);
    setEditedTitle(goal.title);
  };

  const handleSaveEdit = (id: number) => {
    if (editedTitle.trim()) {
      updateGoal.mutate({
        id,
        updates: { title: editedTitle.trim() },
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const newText = newGoal.slice(0, start) + emoji + newGoal.slice(end);
      setNewGoal(newText);
      setTimeout(() => {
        inputRef.current?.setSelectionRange(start + emoji.length, start + emoji.length);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleTranscript = (text: string) => {
    if (text.trim()) {
      setNewGoal(text.trim());
    }
  };

  return (
    <div className="space-y-4">
      {(category === "Goals" && showInput) && (
        <Card style={{ background: 'var(--card-bg)' }}>
          <CardContent className="pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateGoal(newGoal);
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
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a new goal..."
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

      {filteredGoals.map((goal) => (
        <Card key={goal.id} style={{ background: 'var(--card-bg)' }}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={goal.completed}
                onCheckedChange={(checked) => {
                  updateGoal.mutate({
                    id: goal.id,
                    updates: { completed: !!checked },
                  });
                }}
              />
              <div className="flex-1 min-w-0">
                {editingGoal === goal.id ? (
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-background">
                        <EmojiPicker onEmojiSelect={(emoji) => {
                          setEditedTitle(editedTitle + emoji);
                        }} />
                      </PopoverContent>
                    </Popover>
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <Button onClick={() => handleSaveEdit(goal.id)} size="sm">
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingGoal(null)}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className={goal.completed ? "line-through text-muted-foreground" : ""}>
                      {goal.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(goal.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {!editingGoal && (
                  <>
                    {category === "Trash" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateGoal.mutate({
                            id: goal.id,
                            updates: { deleted: false },
                          })}
                          className="h-8 w-8"
                        >
                          <ArrowUpFromLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGoal.mutate(goal.id)}
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
                          onClick={() => handleStartEdit(goal)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateGoal.mutate({
                            id: goal.id,
                            updates: { favorite: !goal.favorite },
                          })}
                          className="h-8 w-8"
                        >
                          <Star className={cn("h-4 w-4", goal.favorite ? "fill-yellow-400 text-yellow-400" : "")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => updateGoal.mutate({
                            id: goal.id,
                            updates: { deleted: true },
                          })}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredGoals.length === 0 && showEmptyState && (
        <div className="text-center text-sm text-muted-foreground">
          {category === "Favorites" && "You don't have any favorites yet"}
          {category === "Trash" && "Trash can is empty"}
          {category === "Goals" && "You don't have any goals yet"}
        </div>
      )}
    </div>
  );
}