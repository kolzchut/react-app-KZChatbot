import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  submitElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, submitElement, ...props }, ref) => {
    return (
      <div className="relative w-full mb-2">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-full font-bold bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-input-placholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_4px_0_rgba(0,0,0,0.10)]",
            { "pl-10": submitElement }, // Add left padding if submitElement is present
            className,
          )}
          ref={ref}
          {...props}
        />
        {submitElement && (
          <button
            type="submit"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer bg-transparent border-none p-0 m-0"
            style={{ pointerEvents: "auto" }} // Ensure the button is clickable
          >
            {submitElement}
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export default Input;
