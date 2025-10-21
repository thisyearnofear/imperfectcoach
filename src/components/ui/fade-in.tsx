import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  /**
   * Direction to fade in from
   * @default "up"
   */
  direction?: "up" | "down" | "left" | "right" | "none";
  /**
   * Duration of the animation in seconds
   * @default 0.3
   */
  duration?: number;
  /**
   * Delay before animation starts in seconds
   * @default 0
   */
  delay?: number;
  /**
   * Distance to move during fade in (in pixels)
   * @default 20
   */
  distance?: number;
  /**
   * Whether to trigger animation only once
   * @default true
   */
  once?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

export function FadeIn({
  children,
  direction = "up",
  duration = 0.3,
  delay = 0,
  distance = 20,
  once = true,
  className,
}: FadeInProps) {
  const directionOffset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1], // Custom ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FadeInStaggerProps {
  children: ReactNode[];
  /**
   * Delay between each child animation in seconds
   * @default 0.1
   */
  staggerDelay?: number;
  /**
   * Direction to fade in from
   * @default "up"
   */
  direction?: "up" | "down" | "left" | "right" | "none";
  /**
   * Duration of each animation in seconds
   * @default 0.3
   */
  duration?: number;
  /**
   * Distance to move during fade in (in pixels)
   * @default 20
   */
  distance?: number;
  /**
   * Custom className for container
   */
  className?: string;
}

/**
 * Fades in multiple children with staggered timing
 */
export function FadeInStagger({
  children,
  staggerDelay = 0.1,
  direction = "up",
  duration = 0.3,
  distance = 20,
  className,
}: FadeInStaggerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const directionOffset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  };

  const offset = directionOffset[direction];

  const itemVariants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {children.map((child, index) => (
        <motion.div key={index} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Simple fade in without directional movement
 */
export function FadeInSimple({
  children,
  duration = 0.3,
  delay = 0,
  className,
}: {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
