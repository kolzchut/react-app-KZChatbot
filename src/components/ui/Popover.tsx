import * as React from "react";
import { cn } from "@/lib/utils";
import "./Popover.css";

interface PopoverProps {
  isChatOpen: boolean;
  onClose: () => void;
  labelledById: string;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({ isChatOpen, onClose, labelledById, children }) => {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  // Drive the native modal from the open state. showModal() gives us focus
  // containment, return-focus on close and page inertness for free.
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isChatOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isChatOpen && dialog.open) {
      dialog.close();
    }
  }, [isChatOpen]);

  // Keep Redux in sync when the dialog closes itself (Escape fires `cancel`).
  const handleCancel = () => onClose();

  return (
    <dialog
      ref={dialogRef}
      className="popover-overlay"
      aria-modal="true"
      aria-labelledby={labelledById}
      onCancel={handleCancel}
    >
      {isChatOpen && children}
    </dialog>
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
