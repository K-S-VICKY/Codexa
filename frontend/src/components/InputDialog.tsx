import React, { useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  placeholder,
  initialValue = '',
  onConfirm,
  onCancel
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Dialog>
        <Title>{title}</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
          />
          <ButtonContainer>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!value.trim()}
            >
              Create
            </Button>
          </ButtonContainer>
        </Form>
      </Dialog>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const Dialog = styled.div`
  background: #2d2d30;
  border: 1px solid #454545;
  border-radius: 8px;
  padding: 24px;
  min-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const Title = styled.h3`
  margin: 0 0 16px 0;
  color: #cccccc;
  font-size: 16px;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  background: #1e1e1e;
  border: 1px solid #454545;
  border-radius: 4px;
  padding: 8px 12px;
  color: #cccccc;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
  
  &::placeholder {
    color: #666666;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;
