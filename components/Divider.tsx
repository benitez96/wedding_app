import { Heart, Sparkles } from "lucide-react";

interface DividerProps {
  variant?: 'simple' | 'heart' | 'ornate' | 'elegant';
  className?: string;
}

export default function Divider({ variant = 'heart', className = "" }: DividerProps) {
  if (variant === 'simple') {
    return (
      <div className={`w-full flex justify-center py-2 ${className}`}>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-foreground/30 to-transparent"></div>
      </div>
    );
  }

  if (variant === 'heart') {
    return (
      <div className={`w-full flex justify-center items-center py-2 ${className}`}>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent"></div>
        <Heart className="w-5 h-5 mx-4 text-primary-500" fill="currentColor" />
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-foreground/25 to-transparent"></div>
      </div>
    );
  }

  if (variant === 'ornate') {
    return (
      <div className={`w-full flex justify-center items-center py-2 ${className}`}>
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"></div>
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-2"></div>
        <div className="w-6 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"></div>
        <Heart className="w-4 h-4 mx-3 text-primary-500" fill="currentColor" />
        <div className="w-6 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"></div>
        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-2"></div>
        <div className="w-12 h-px bg-gradient-to-r from-transparent via-foreground/40 to-transparent"></div>
      </div>
    );
  }

  if (variant === 'elegant') {
    return (
      <div className={`w-full flex justify-center items-center py-2 ${className}`}>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
        <Sparkles className="w-4 h-4 mx-2 text-accent-500" />
        <div className="w-4 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
        <Heart className="w-3 h-3 mx-1 text-primary-500" fill="currentColor" />
        <div className="w-4 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
        <Sparkles className="w-4 h-4 mx-2 text-accent-500" />
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"></div>
      </div>
    );
  }

  return null;
}
