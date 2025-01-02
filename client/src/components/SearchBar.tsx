import { useState } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, File, ListTodo, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SearchResult {
  id: number;
  title: string;
  type: 'task' | 'file' | 'goal';
  category?: string;
}

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch tasks
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    enabled: open,
  });

  // Filter items based on search
  const filtered: SearchResult[] = search.length >= 3
    ? [
        ...tasks.map(task => ({
          id: task.id,
          title: task.title,
          type: 'task' as const,
          category: task.category
        })),
      ].filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div 
        onClick={() => setOpen(true)}
        className="p-2 rounded-md hover:bg-accent/50 cursor-pointer"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>

      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command className="rounded-lg border shadow-md">
          <CommandInput
            placeholder="Type to search..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {search.length >= 3 && (
              <CommandGroup>
                {filtered.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-2 py-3"
                  >
                    {item.type === 'task' && <ListTodo className="h-4 w-4" />}
                    {item.type === 'file' && <File className="h-4 w-4" />}
                    {item.type === 'goal' && <Target className="h-4 w-4" />}
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      {item.category && (
                        <span className="text-xs text-muted-foreground">
                          in {item.category}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}