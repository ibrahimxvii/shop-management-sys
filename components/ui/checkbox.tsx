import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, id, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate]);

    const inputId = id ?? React.useId();

    const checkbox = (
      <span className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={inputId}
          ref={inputRef}
          className={cn(
            "peer h-4 w-4 shrink-0 cursor-pointer rounded-[4px] border border-input",
            "appearance-none bg-background shadow-xs",
            "checked:bg-primary checked:border-primary",
            "indeterminate:bg-primary indeterminate:border-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            className
          )}
          {...props}
        />
        <svg
          className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100 transition-opacity"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {indeterminate ? (
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </span>
    );

    if (!label && !description) {
      return checkbox;
    }

    return (
      <label
        htmlFor={inputId}
        className="flex items-start gap-2.5 cursor-pointer"
      >
        {checkbox}
        {(label || description) && (
          <span className="flex flex-col gap-0.5">
            {label && <span className="text-sm font-medium leading-none">{label}</span>}
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
