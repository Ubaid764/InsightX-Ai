import { BarChart3 } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dim} bg-gradient-brand rounded-lg flex items-center justify-center shadow-glow`}>
        <BarChart3 className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`font-semibold tracking-tight ${text}`}>
          Insight<span className="text-gradient-brand">X</span>
        </span>
      )}
    </div>
  );
}
