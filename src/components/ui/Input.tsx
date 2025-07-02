import * as React from "react";
import { Errors } from "@/types";
import { cn } from "@/lib/utils";
import "../chatInput.css";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  submitElement?: React.ReactNode;
  errors?: Errors;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, submitElement, errors, ...props }, ref) => {
    return (
      <div className="chat-input-wrapper">
        <div className="chat-input-field-container">
          <input
            type={type}
            className={cn(
              "chat-input-field",
              { "with-submit-button": submitElement },
              className,
            )}
            ref={ref}
            {...props}
          />
          {submitElement && (
            <button
              type="submit"
              className="chat-input-submit-button"
            >
              {submitElement}
            </button>
          )}
        </div>
        {errors && errors.question && (
          <p
            className="chat-input-error"
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
