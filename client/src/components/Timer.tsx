import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Coffee, Clock, Timer as TimerIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { clsx } from "clsx";
import { useTheme } from "@/contexts/ThemeContext";

type TimerMode = "focus" | "tracker" | "fade";
type TimerPhase = "work" | "break";

export default function Timer() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [seconds, setSeconds] = useState(1500); // 25 minutes for focus mode
  const [trackerSeconds, setTrackerSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>("work");
  const [showModeSelector, setShowModeSelector] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      if (mode === "focus" && seconds > 0) {
        interval = setInterval(() => {
          setSeconds((seconds) => seconds - 1);
        }, 1000);
      } else if (mode === "tracker") {
        interval = setInterval(() => {
          setTrackerSeconds((secs) => {
            // Max out at 23:59:59 (86399 seconds)
            return secs < 86399 ? secs + 1 : secs;
          });
        }, 1000);
      }
    }

    if (mode === "focus" && seconds === 0) {
      // Phase completed
      if (phase === "work") {
        setPhase("break");
        setSeconds(300); // 5 minutes break
      } else {
        setPhase("work");
        setSeconds(1500); // Back to 25 minutes work
      }
      setIsActive(false);

      // Notify user
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(
          phase === "work"
            ? "Time for a break! 🎉"
            : "Break's over! Let's get back to work 💪"
        );
      }
    }

    return () => clearInterval(interval);
  }, [isActive, seconds, phase, mode, trackerSeconds]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === "focus") {
      setSeconds(phase === "work" ? 1500 : 300);
    } else if (mode === "tracker") {
      setTrackerSeconds(0);
    }
  };

  const formatTime = (secs: number) => {
    if (mode === "tracker") {
      const hours = Math.floor(secs / 3600);
      const minutes = Math.floor((secs % 3600) / 60);
      const remainingSeconds = secs % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(secs / 60);
      const remainingSeconds = secs % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const switchMode = (newMode: TimerMode) => {
    setIsActive(false);
    setMode(newMode);
    if (newMode === "focus") {
      setSeconds(1500);
      setPhase("work");
    } else if (newMode === "tracker") {
      setTrackerSeconds(0);
    }
    setShowModeSelector(false);
  };

  if (mode === "fade") {
    return (
      <div className="flex justify-end border-t border-border/40">
        <Popover open={showModeSelector} onOpenChange={setShowModeSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground/50 hover:text-primary hover:bg-transparent transition-all duration-300"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Command>
              <CommandGroup>
                <CommandItem onSelect={() => switchMode("focus")}>
                  <Clock className="h-4 w-4 mr-2" />
                  Focus Time
                </CommandItem>
                <CommandItem onSelect={() => switchMode("tracker")}>
                  <Clock className="h-4 w-4 mr-2" />
                  Time Tracker
                </CommandItem>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm mx-auto" style={{ background: 'var(--timer-bg)' }}>
      <CardContent className="p-6">
        <div className="text-center">
          <div
            className={clsx(
              "font-mono text-4xl mb-4 p-4 rounded-lg",
              {
                "bg-primary/10 text-foreground": mode === "focus" && phase === "work",
                "bg-green-100 dark:bg-green-900/50 text-foreground": mode === "focus" && phase === "break",
                "bg-[#3b82f6] text-white": mode === "tracker"
              }
            )}
          >
            {mode === "tracker" ? formatTime(trackerSeconds) : formatTime(seconds)}
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            <div className="flex items-center justify-center gap-2">
              <Popover open={showModeSelector} onOpenChange={setShowModeSelector}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 transition-all duration-300 text-foreground"
                  >
                    {mode === "focus" ? (
                      phase === "work" ? (
                        <>
                          <Clock className="h-4 w-4" />
                          Focus Time
                        </>
                      ) : (
                        <>
                          <Coffee className="h-4 w-4" />
                          Break Time
                        </>
                      )
                    ) : (
                      <>
                        <Clock className="h-4 w-4" />
                        Time Tracker
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandGroup>
                      <CommandItem onSelect={() => switchMode("focus")}>
                        <Clock className="h-4 w-4 mr-2" />
                        Focus Time
                      </CommandItem>
                      <CommandItem onSelect={() => switchMode("tracker")}>
                        <Clock className="h-4 w-4 mr-2" />
                        Time Tracker
                      </CommandItem>
                      <CommandItem onSelect={() => switchMode("fade")}>
                        <div className="h-4 w-4 mr-2 rounded bg-muted" />
                        Fade Out
                      </CommandItem>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTimer}
              style={{ 
                background: 'var(--timer-button-bg)',
                color: mode === "tracker" ? "#3b82f6" : undefined
              }}
            >
              {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={resetTimer}
              style={{ 
                background: 'var(--timer-button-bg)',
                color: mode === "tracker" ? "#3b82f6" : undefined
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}