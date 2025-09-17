import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const ripple = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

const BaseButton = styled.button<{
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  outline: none;
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case 'sm':
        return `
          padding: 8px 16px;
          font-size: 14px;
          min-height: 36px;
        `;
      case 'lg':
        return `
          padding: 16px 32px;
          font-size: 16px;
          min-height: 52px;
        `;
      default:
        return `
          padding: 12px 24px;
          font-size: 15px;
          min-height: 44px;
        `;
    }
  }}
  
  /* Color variants */
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.3);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(99, 102, 241, 0.4);
          }
          
          &:active:not(:disabled) {
            transform: translateY(0);
          }
        `;
      case 'secondary':
        return `
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 102, 241, 0.3);
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: #e2e8f0;
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
          }
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 14px 0 rgba(239, 68, 68, 0.3);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px 0 rgba(239, 68, 68, 0.4);
          }
        `;
      default:
        return '';
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &:focus-visible {
    outline: 2px solid #6366f1;
    outline-offset: 2px;
  }
  
  /* Shimmer effect for loading */
  ${props => props.isLoading && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: ${shimmer} 1.5s infinite;
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: ${keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  `} 1s linear infinite;
`;

const RippleEffect = styled.span`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  animation: ${ripple} 0.6s linear;
`;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || props.disabled) return;
    
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
    
    onClick?.(event);
  };

  return (
    <BaseButton
      variant={variant}
      size={size}
      isLoading={isLoading}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {children}
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </BaseButton>
  );
};
