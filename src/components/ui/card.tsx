import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className = "", children, ...props }: Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }: Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
