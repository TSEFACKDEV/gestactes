/**
 * Bouton.
 * Propriétaire : GUEMOGNE GERALDINE ESTHER
 * TODO :
 *  [ ] Vérifier les états focus/disabled au clavier.
 *  [ ] Ajouter un test de rendu.
 */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { LuLoaderCircle } from "react-icons/lu";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-sm disabled:bg-primary/50",
  secondary:
    "border border-line bg-surface text-ink hover:bg-surface-muted disabled:text-ink-soft/50",
  ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
  link: "text-primary underline-offset-4 hover:underline",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <LuLoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading ? rightIcon : null}
    </button>
  ),
);

Button.displayName = "Button";
