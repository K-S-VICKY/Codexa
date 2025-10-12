import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Task, TaskFormData } from '../types/task';

interface TaskFormProps {
  task: Task | null;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const FormTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  color: #111827;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #c7d2fe;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  color: #111827;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #c7d2fe;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  color: #111827;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #c7d2fe;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  
  option {
    background: #ffffff;
    color: #111827;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid transparent;
  transition: box-shadow 0.2s ease, transform 0.05s ease, opacity 0.2s ease;

  ${props => props.variant === 'primary' ? `
    background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #8b5cf6, #22d3ee);
    background-origin: border-box;
    background-clip: padding-box, border-box;
    color: #111827;
    
    &:hover { box-shadow: 0 2px 6px rgba(139, 92, 246, 0.2); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  ` : `
    background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #9ca3af, #d1d5db);
    background-origin: border-box;
    background-clip: padding-box, border-box;
    color: #374151;
    
    &:hover { box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
  `}
`;

export const TaskForm: React.FC<TaskFormProps> = ({ task, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    deadline: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    onSubmit({
      ...formData,
      deadline: formData.deadline || undefined
    });
  };

  const handleChange = (field: keyof TaskFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <Overlay onClick={onCancel}>
      <FormContainer onClick={(e) => e.stopPropagation()}>
        <FormHeader>
          <FormTitle>{task ? 'Edit Task' : 'New Task'}</FormTitle>
          <CloseButton onClick={onCancel}>×</CloseButton>
        </FormHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Title *</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={handleChange('title')}
              placeholder="Enter task title..."
              required
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={formData.description}
              onChange={handleChange('description')}
              placeholder="Enter task description..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onChange={handleChange('priority')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Deadline</Label>
            <Input
              type="datetime-local"
              value={formData.deadline}
              onChange={handleChange('deadline')}
            />
          </FormGroup>

          <ButtonGroup>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </ButtonGroup>
        </Form>
      </FormContainer>
    </Overlay>
  );
};
