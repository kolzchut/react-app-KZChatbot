import * as React from "react";
import { Errors } from "@/types";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  submitElement?: React.ReactNode;
  errors: Errors;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, submitElement, errors, ...props }, ref) => {
    return (
      <div className="w-full mb-2">
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-12 w-full rounded-full font-bold bg-input px-3 py-2 text-sm ring-offset-background placeholder:text-input-placholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_4px_0_rgba(0,0,0,0.10)]",
              { "pl-10": submitElement },
              className,
            )}
            ref={ref}
            {...props}
          />
          {submitElement && (
            <button
              type="submit"
              className="absolute left-2 top-1/2 translate-y-1/2 cursor-pointer bg-transparent border-none p-0 m-0"
              style={{ pointerEvents: "auto" }}
            >
              {submitElement}
            </button>
          )}
        </div>
        {errors.question && (
          <p
            className="text-sm text-destructive bg-destructive inline-block px-1 mt-1 mb-0"
            role="alert"
          >
            {errors.question}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export default Input;
