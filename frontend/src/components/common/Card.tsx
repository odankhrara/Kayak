import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const Card = ({ children, interactive = false, className = '', onClick }: CardProps) => {
  const baseClass = 'card';
  const interactiveClass = interactive ? 'card-interactive' : '';

  return (
    <div
      className={`${baseClass} ${interactiveClass} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card;

