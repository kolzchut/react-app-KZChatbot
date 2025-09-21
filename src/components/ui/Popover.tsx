import * as React from "react";
import { cn } from "@/lib/utils";
import "./Popover.css";

interface PopoverProps {
  isChatOpen: boolean;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ isChatOpen, children }) => {
  if (!isChatOpen) return null;
  
  return (
    <div className="popover-overlay">
      {children}
    </div>
  );
};

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }
>(({ className, children, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "popover-content",
        className,
      )}
      style={{
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent };
