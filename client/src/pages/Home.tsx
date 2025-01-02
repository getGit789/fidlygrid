import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Timer from "@/components/Timer";
import TaskList from "@/components/TaskList";
import Goals from "@/components/Goals";
import SearchBar from "@/components/SearchBar";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface Task {
  id: number;
  title: string;
  completed: boolean;
  favorite: boolean;
  deleted: boolean;
  category: string;
}

interface Goal {
  id: number;
  title: string;
  completed: boolean;
  favorite: boolean;
  deleted: boolean;
  category: string;
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Home");
  const currentDate = new Date();
  const formattedDate = format(currentDate, "EEEE, MMMM d");
  const [timestamp] = useState(Date.now());

  // Fetch tasks and goals data
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const getMainContent = () => {
    switch (selectedCategory) {
      case "Home":
        return (
          <div className="space-y-8">
            <Goals category="Goals" showEmptyState={false} showInput={false} />
            <TaskList category="Tasks" showEmptyState={false} showInput={false} />
          </div>
        );
      case "Goals":
        return <Goals category="Goals" />;
      case "Tasks":
      case "My Tasks":
        return <TaskList category="Tasks" />;
      case "Favorites":
        return (
          <div className="space-y-8">
            <Goals category="Favorites" showEmptyState={false} />
            <TaskList category="Favorites" showEmptyState={false} />
            {!goals.some((g: Goal) => g.favorite && !g.deleted) && 
             !tasks.some((t: Task) => t.favorite && !t.deleted) && (
              <div className="text-center text-sm text-muted-foreground">
                You don't have any favorites yet
              </div>
            )}
          </div>
        );
      case "Trash":
        return (
          <div className="space-y-8">
            <Goals category="Trash" showEmptyState={false} />
            <TaskList category="Trash" showEmptyState={false} />
            {!goals.some((g: Goal) => g.deleted) && 
             !tasks.some((t: Task) => t.deleted) && (
              <div className="text-center text-sm text-muted-foreground">
                Trash can is empty
              </div>
            )}
          </div>
        );
      default:
        return <TaskList category={selectedCategory} />;
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--app-bg)' }}>
      <Sidebar selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="pb-4 border-b border-border mb-8">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">
                  <button className="hover:text-foreground">
                    {formattedDate} <span className="ml-1">›</span>
                  </button>
                </div>
                <h1 className="text-4xl font-light mt-1" key={`welcome-text-${timestamp}`}>
                  Welcome
                </h1>
              </div>
              <SearchBar />
            </div>
          </div>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              {getMainContent()}
            </div>

            <div className="w-[300px] ml-6">
              <Timer />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}