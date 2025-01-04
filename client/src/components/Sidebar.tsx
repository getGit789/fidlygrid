import { useState } from "react";
import { Home, ListTodo, Target, Settings, LucideIcon, Sun, Moon, Star, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

interface NavItem {
  name: string;
  icon: LucideIcon;
  count?: number;
}

export default function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  const { theme, setTheme } = useTheme();

  // Fetch tasks and goals to get the counts
  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: ["/api/goals"],
  });

  // Update counts
  const taskCount = tasks.filter(task => !task.deleted).length;
  const goalCount = goals.filter(goal => !goal.deleted).length;
  const favoriteCount = [
    ...tasks.filter(task => task.favorite && !task.deleted),
    ...goals.filter(goal => goal.favorite && !goal.deleted)
  ].length;
  const trashCount = [
    ...tasks.filter(task => task.deleted),
    ...goals.filter(goal => goal.deleted)
  ].length;

  const handleSelectCategory = (item: NavItem) => {
    onSelectCategory(item.name);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearance: newTheme }),
    });
  };

  return (
    <div className="w-64 border-r" style={{ background: 'var(--sidebar-bg)' }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8">
              <div className="bg-primary/10 rounded-md p-1.5">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">FidlyGrid</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light Theme
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-6">
        <div className="px-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2">
            GENERAL
          </h3>
          <nav className="space-y-1">
            {[
              { name: "Home", icon: Home },
              { name: "My Tasks", icon: ListTodo, count: taskCount },
              { name: "Goals", icon: Target, count: goalCount },
              { name: "Favorites", icon: Star, count: favoriteCount },
              { name: "Trash", icon: Trash, count: trashCount },
            ].map((item) => (
              <div
                key={item.name}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer",
                  selectedCategory === item.name
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-primary/5"
                )}
                onClick={() => handleSelectCategory(item)}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.name}</span>
                {item.count !== undefined && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.count}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}