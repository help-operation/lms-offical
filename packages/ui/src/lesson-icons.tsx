"use client";

import {
  // Navigation / arrows
  ArrowRight, ArrowRightCircle, ChevronRight, ChevronsRight, MoveRight, CornerDownRight,
  // Play / media
  PlayCircle, Play, Video, Film, Clapperboard, MonitorPlay, Tv, Mic, Headphones, Music,
  // Checks
  Check, CircleCheck, CheckCheck, BadgeCheck, ListChecks, ClipboardList, SquareCheck,
  // Hands / gestures
  Hand, ThumbsUp, ThumbsDown, HandMetal, Grab, Pointer, Handshake,
  // Education
  BookOpen, GraduationCap, Lightbulb, Brain, Pencil, PenTool, NotebookPen, School, Library, Backpack, FileText,
  // Achievement
  Trophy, Medal, Award, Rocket, Crown, Gem, Gift, Star, Flame, Zap, Sparkles,
  // Markers / shapes / misc
  Target, Flag, Bookmark, Compass, Puzzle, Layers, Heart, Bell, Key, Lock,
  Circle, Square, Diamond, MapPin, Pin, CircleDot, Dot,
} from "lucide-react";
import type { ComponentType } from "react";

/** Custom "index finger pointing right" (👉) — lucide has no equivalent. Filled silhouette. */
function HandPointRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* wrist / cuff */}
      <rect x="1.5" y="8.5" width="4.5" height="8" rx="1.6" />
      {/* fist */}
      <rect x="4.5" y="6.5" width="9" height="12" rx="3.5" />
      {/* thumb */}
      <rect x="6.5" y="5" width="5.5" height="4.5" rx="2.25" />
      {/* index finger pointing right */}
      <rect x="11" y="7.6" width="11.5" height="3.8" rx="1.9" />
    </svg>
  );
}

export interface LessonIconOption {
  value: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

/** Selectable icons for curriculum lesson rows (per-course). */
export const LESSON_ICONS: LessonIconOption[] = [
  // Navigation / arrows
  { value: "play-circle",       label: "Play circle",      Icon: PlayCircle },
  { value: "play",              label: "Play",             Icon: Play },
  { value: "arrow-right",       label: "Arrow",            Icon: ArrowRight },
  { value: "arrow-right-circle",label: "Arrow circle",     Icon: ArrowRightCircle },
  { value: "chevron-right",     label: "Chevron",          Icon: ChevronRight },
  { value: "chevrons-right",    label: "Double chevron",   Icon: ChevronsRight },
  { value: "move-right",        label: "Move right",       Icon: MoveRight },
  { value: "corner-down-right", label: "Corner",           Icon: CornerDownRight },

  // Checks
  { value: "check",             label: "Check",            Icon: Check },
  { value: "circle-check",      label: "Check circle",     Icon: CircleCheck },
  { value: "check-check",       label: "Double check",     Icon: CheckCheck },
  { value: "badge-check",       label: "Badge check",      Icon: BadgeCheck },
  { value: "square-check",      label: "Check square",     Icon: SquareCheck },
  { value: "list-checks",       label: "List checks",      Icon: ListChecks },
  { value: "clipboard-list",    label: "Clipboard",        Icon: ClipboardList },

  // Hands / gestures
  { value: "hand-point-right",  label: "Point right",      Icon: HandPointRight },
  { value: "hand",              label: "Hand",             Icon: Hand },
  { value: "thumbs-up",         label: "Thumbs up",        Icon: ThumbsUp },
  { value: "thumbs-down",       label: "Thumbs down",      Icon: ThumbsDown },
  { value: "hand-metal",        label: "Hand metal",       Icon: HandMetal },
  { value: "grab",              label: "Grab",             Icon: Grab },
  { value: "pointer",           label: "Pointer",          Icon: Pointer },
  { value: "handshake",         label: "Handshake",        Icon: Handshake },

  // Media
  { value: "video",             label: "Video",            Icon: Video },
  { value: "film",              label: "Film",             Icon: Film },
  { value: "clapperboard",      label: "Clapperboard",     Icon: Clapperboard },
  { value: "monitor-play",      label: "Monitor play",     Icon: MonitorPlay },
  { value: "tv",                label: "TV",               Icon: Tv },
  { value: "mic",               label: "Mic",              Icon: Mic },
  { value: "headphones",        label: "Headphones",       Icon: Headphones },
  { value: "music",             label: "Music",            Icon: Music },

  // Education
  { value: "book",              label: "Book",             Icon: BookOpen },
  { value: "graduation-cap",    label: "Graduation",       Icon: GraduationCap },
  { value: "lightbulb",         label: "Lightbulb",        Icon: Lightbulb },
  { value: "brain",             label: "Brain",            Icon: Brain },
  { value: "pencil",            label: "Pencil",           Icon: Pencil },
  { value: "pen-tool",          label: "Pen tool",         Icon: PenTool },
  { value: "notebook-pen",      label: "Notebook",         Icon: NotebookPen },
  { value: "school",            label: "School",           Icon: School },
  { value: "library",           label: "Library",          Icon: Library },
  { value: "backpack",          label: "Backpack",         Icon: Backpack },
  { value: "file-text",         label: "File",             Icon: FileText },

  // Achievement
  { value: "trophy",            label: "Trophy",           Icon: Trophy },
  { value: "medal",             label: "Medal",            Icon: Medal },
  { value: "award",             label: "Award",            Icon: Award },
  { value: "rocket",            label: "Rocket",           Icon: Rocket },
  { value: "crown",             label: "Crown",            Icon: Crown },
  { value: "gem",               label: "Gem",              Icon: Gem },
  { value: "gift",              label: "Gift",             Icon: Gift },
  { value: "star",              label: "Star",             Icon: Star },
  { value: "flame",             label: "Flame",            Icon: Flame },
  { value: "zap",               label: "Zap",              Icon: Zap },
  { value: "sparkles",          label: "Sparkles",         Icon: Sparkles },

  // Markers / shapes / misc
  { value: "target",            label: "Target",           Icon: Target },
  { value: "flag",              label: "Flag",             Icon: Flag },
  { value: "bookmark",          label: "Bookmark",         Icon: Bookmark },
  { value: "compass",           label: "Compass",          Icon: Compass },
  { value: "puzzle",            label: "Puzzle",           Icon: Puzzle },
  { value: "layers",            label: "Layers",           Icon: Layers },
  { value: "heart",             label: "Heart",            Icon: Heart },
  { value: "bell",              label: "Bell",             Icon: Bell },
  { value: "key",               label: "Key",              Icon: Key },
  { value: "lock",              label: "Lock",             Icon: Lock },
  { value: "target-circle",     label: "Circle",           Icon: Circle },
  { value: "square",            label: "Square",           Icon: Square },
  { value: "diamond",           label: "Diamond",          Icon: Diamond },
  { value: "map-pin",           label: "Map pin",          Icon: MapPin },
  { value: "pin",               label: "Pin",              Icon: Pin },
  { value: "circle-dot",        label: "Circle dot",       Icon: CircleDot },
  { value: "dot",               label: "Dot",              Icon: Dot },
];

export function resolveLessonIcon(name?: string, fallback = "play-circle"): LessonIconOption {
  return (
    LESSON_ICONS.find((o) => o.value === name) ??
    LESSON_ICONS.find((o) => o.value === fallback) ??
    LESSON_ICONS[0]!
  );
}

/** Renders the chosen lesson icon, falling back to a per-template default. */
export function LessonIcon({ name, fallback, className }: { name?: string; fallback?: string; className?: string }) {
  const { Icon } = resolveLessonIcon(name, fallback);
  return <Icon className={className} />;
}
