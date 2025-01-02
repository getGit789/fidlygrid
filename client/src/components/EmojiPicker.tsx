import { useState } from "react";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";

const EMOJI_OPTIONS = [
  "📝", "✨", "🎯", "🚀", "⭐", "✅", "💡", "🎨", "📊", "🔍",
  "📅", "🎉", "💪", "🌟", "📈", "🔥", "✍️", "📌", "🎯", "💫"
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  return (
    <Command>
      <CommandGroup>
        <div className="grid grid-cols-5 gap-1 p-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <CommandItem
              key={emoji}
              onSelect={() => onEmojiSelect(emoji)}
              className="cursor-pointer p-2 hover:bg-accent rounded justify-center"
            >
              {emoji}
            </CommandItem>
          ))}
        </div>
      </CommandGroup>
    </Command>
  );
}