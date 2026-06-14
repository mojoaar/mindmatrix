import {
  BookOpen, FolderKanban, Code, FileCode, Rocket, Shield, Brain,
  Terminal, Database, Cloud, Server, Globe, Lock, Key, Bell,
  MessageSquare, Users, UserCheck, UserPlus, Archive, Bookmark,
  Briefcase, Building2, Calendar, Camera, Clipboard, Clock,
  Cog, Compass, Contact, Crown, Download, FileText, Flag,
  Flame, Folder, FolderTree, Gem, Gift, GraduationCap, Heart,
  Home, Image, Inbox, Info, Layers, Layout, Lightbulb, Link2,
  Mail, Map, Megaphone, Monitor, Moon, MousePointer2, Music,
  Network, Notebook, Package, Paintbrush, Palette, Paperclip,
  Phone, PieChart, Pin, Plane, Play, Printer, Puzzle, Radio,
  Receipt, RefreshCw, Search, Send, Share2, ShoppingBag,
  Signal, Sliders, Smile, Speaker, Star, Sun, Table, Tag,
  Target, ThumbsUp, Ticket, Trash2, Trophy, Truck, Upload,
  Video, Wifi, Wind, Zap, ZoomIn, Blocks, Bot, ChartArea,
  ChartBar, ChartLine, CircleDot, CloudLightning, CloudRain,
  Dices, Ear, Eye, Fingerprint, FlaskConical, Ghost, GitBranch,
  GitCommit, GitPullRequest, Hammer, HardDrive, Headphones,
  Microscope, Music4, Orbit, Rabbit, Scan, Scissors, Ship,
  Skull, Snowflake, Swords, TrafficCone, Umbrella, Waves,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  BookOpen, FolderKanban, Code, FileCode, Rocket, Shield, Brain,
  Terminal, Database, Cloud, Server, Globe, Lock, Key, Bell,
  MessageSquare, Users, UserCheck, UserPlus, Archive, Bookmark,
  Briefcase, Building2, Calendar, Camera, Clipboard, Clock,
  Cog, Compass, Contact, Crown, Download, FileText, Flag,
  Flame, Folder, FolderTree, Gem, Gift, GraduationCap, Heart,
  Home, Image, Inbox, Info, Layers, Layout, Lightbulb, Link2,
  Mail, Map, Megaphone, Monitor, Moon, MousePointer2, Music,
  Network, Notebook, Package, Paintbrush, Palette, Paperclip,
  Phone, PieChart, Pin, Plane, Play, Printer, Puzzle, Radio,
  Receipt, RefreshCw, Search, Send, Share2, ShoppingBag,
  Signal, Sliders, Smile, Speaker, Star, Sun, Table, Tag,
  Target, ThumbsUp, Ticket, Trash2, Trophy, Truck, Upload,
  Video, Wifi, Wind, Zap, ZoomIn, Blocks, Bot, ChartArea,
  ChartBar, ChartLine, CircleDot, CloudLightning, CloudRain,
  Dices, Ear, Eye, Fingerprint, FlaskConical, Ghost, GitBranch,
  GitCommit, GitPullRequest, Hammer, HardDrive, Headphones,
  Microscope, Music4, Orbit, Rabbit, Scan, Scissors, Ship,
  Skull, Snowflake, Swords, TrafficCone, Umbrella, Waves,
};

export const ICON_LIST = Object.keys(ICONS).sort();

export function getIcon(name: string): LucideIcon {
  return ICONS[name] || BookOpen;
}
