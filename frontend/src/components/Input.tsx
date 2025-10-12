import React, { useState, useRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const focusGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
`;

const Container = styled.div`
  position: relative;
  margin: 12px 0;
`;

const StyledInput = styled.input<{ hasValue: boolean; hasError: boolean }>`
  width: 100%;
  padding: 16px 16px 8px 16px;
  border: 2px solid ${props => props.hasError ? props.theme.colors.error : '#3A3A3F'};
  border-radius: 12px;
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.textPrimary};
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:focus {
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.accent};
    animation: ${focusGlow} 0.6s ease-out;
    background: ${props => props.theme.colors.inputBg};
    box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
  }
  
  &:hover:not(:focus) {
    border-color: ${props => props.hasError ? props.theme.colors.error : '#4A4A50'};
  }
  
  &::placeholder {
    color: transparent;
  }
  
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0 1000px ${props => props.theme.colors.inputBg} inset;
    -webkit-text-fill-color: ${props => props.theme.colors.textPrimary};
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const Label = styled.label<{ isFocused: boolean; hasValue: boolean; hasError: boolean }>`
  position: absolute;
  left: 16px;
  top: ${props => (props.isFocused || props.hasValue) ? '8px' : '16px'};
  font-size: ${props => (props.isFocused || props.hasValue) ? '12px' : '16px'};
  color: ${props => {
    if (props.hasError) return props.theme.colors.error;
    if (props.isFocused) return props.theme.colors.accent;
    return props.theme.colors.textSecondary;
  }};
  font-weight: ${props => (props.isFocused || props.hasValue) ? '500' : '400'};
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: left top;
  background: transparent;
  padding: 0;
  margin-left: 0;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: 14px;
  margin-top: 6px;
  margin-left: 4px;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 0.2s ease-out;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HelperText = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  margin-top: 6px;
  margin-left: 4px;
`;

const IconContainer = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  pointer-events: none;
  transition: color 0.2s ease;
`;

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  value,
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const hasValue = Boolean(value && value.toString().length > 0);
  const hasError = Boolean(error);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleLabelClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Container>
      <StyledInput
        ref={inputRef}
        hasValue={hasValue}
        hasError={hasError}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      <Label
        isFocused={isFocused}
        hasValue={hasValue}
        hasError={hasError}
        onClick={handleLabelClick}
      >
        {label}
      </Label>
      {icon && (
        <IconContainer>
          {icon}
        </IconContainer>
      )}
      {error && (
        <ErrorMessage className="show">
          {error}
        </ErrorMessage>
      )}
      {helperText && !error && (
        <HelperText>
          {helperText}
        </HelperText>
      )}
    </Container>
  );
};
