import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  isChatOpen: boolean;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ isChatOpen, children }) => {
  if (!isChatOpen) return null;
  
  return (
    <div className="fixed inset-0 z-40">
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
>(({ className, align = "center", sideOffset = 4, children, style, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed bottom-4 right-4 border border-solid border-white overflow-hidden z-50 w-[327px] h-[515px] flex flex-col justify-between bg-white text-gray-900 outline-none shadow-lg rounded-lg",
        className,
      )}
      style={{
        transition: "all 0.2s ease-in-out",
        opacity: 1,
        transform: "scale(1)",
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
