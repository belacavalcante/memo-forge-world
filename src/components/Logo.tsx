import { Sparkles } from "lucide-react";

export const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };
  const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <div className="flex items-center gap-2">
      <div className="gradient-primary p-1.5 rounded-lg shadow-glow">
        <Sparkles className={`${iconSizes[size]} text-primary-foreground`} strokeWidth={2.5} />
      </div>
      <span className={`font-semibold tracking-tight ${sizes[size]}`}>Lumi</span>
    </div>
  );
};