import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";

export function MobileDataList({
  children,
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      role="list"
      ref={ref}
      className={cn("divide-y divide-border border-t border-border md:hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function MobileDataListItem({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <article role="listitem" className={cn("px-4 py-4", className)} {...props}>
      {children}
    </article>
  );
}

export function MobileDataEmpty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
