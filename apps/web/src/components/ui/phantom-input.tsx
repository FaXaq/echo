import * as React from "react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PhantomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> { }

const PhantomInput = React.forwardRef<HTMLInputElement, PhantomInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "bg-transparent border-0 outline-none",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "w-full px-0 py-0.5",
          className,
        )}
        {...props}
      />
    );
  },
);

PhantomInput.displayName = "PhantomInput";

export { PhantomInput };
