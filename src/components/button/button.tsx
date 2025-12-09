import React from "react";
import styles from "./button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "default" | "outline" ;
  size?: "sm" | "default" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

}

export const Button = ({
  children,
  variant = "default",
  size = "default",
  type = "button",
  onClick,
  
}: ButtonProps) => {
  const variantClass = {
    default: styles.default,
    outline: styles.outline,
  }[variant];

  const sizeClass = {
    sm: styles.sm,
    default: styles.defaultSize,
    lg: styles.lg,
    icon: styles.icon,
  }[size];

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${sizeClass}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
