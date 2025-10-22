import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RippleButtonProps extends Omit<ButtonProps, "asChild"> {
  /**
   * Whether to enable ripple effect
   * @default true
   */
  enableRipple?: boolean;
}

export interface AnimatedButtonProps extends Omit<ButtonProps, "asChild"> {
  /**
   * Whether to disable animations
   * @default false
   */
  disableAnimation?: boolean;
  
  /**
   * Animation preset
   * @default "default"
   */
  animationPreset?: "default" | "scale" | "lift" | "glow";
}

const animationVariants = {
  default: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  scale: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  },
  lift: {
    hover: { y: -2, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" },
    tap: { y: 0, boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" },
  },
  glow: {
    hover: { 
      scale: 1.02,
      boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)",
    },
    tap: { scale: 0.98 },
  },
};

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ 
    className, 
    disableAnimation = false, 
    animationPreset = "default",
    children, 
    ...props 
  }, ref) => {
    if (disableAnimation) {
      return (
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      );
    }

    const variant = animationVariants[animationPreset];

    return (
      <motion.div
        whileHover={variant.hover}
        whileTap={variant.tap}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17,
        }}
      >
        <Button ref={ref} className={className} {...props}>
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, enableRipple = true, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(enableRipple && "ripple-effect", className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export { AnimatedButton, RippleButton };
