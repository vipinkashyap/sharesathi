import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = '', style, onClick }: CardProps) {
  const baseClasses = 'card p-4';
  const clickableClasses = onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
