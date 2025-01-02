import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
      <Card className="w-[400px] bg-background">
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <time className="text-7xl font-light tracking-tight tabular-nums text-foreground">
              {time.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
              })}
            </time>
            <p className="mt-4 text-sm text-muted-foreground">
              {time.toLocaleDateString([], { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}