import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Task, TaskPriority, TaskFormData } from '../types/task';

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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const FormContainer = styled.div`
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
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
  font-weight: 600;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #cccccc;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #333;
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
  font-weight: 500;
  color: #cccccc;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  
  &::placeholder {
    color: #666;
  }
`;

const TextArea = styled.textarea`
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  
  &::placeholder {
    color: #666;
  }
`;

const Select = styled.select`
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #007acc;
    box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
  }
  
  option {
    background: #1e1e1e;
    color: #ffffff;
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
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: #007acc;
    color: white;
    
    &:hover {
      background: #005a9e;
    }
    
    &:disabled {
      background: #555;
      cursor: not-allowed;
    }
  ` : `
    background: transparent;
    color: #cccccc;
    border: 1px solid #3e3e42;
    
    &:hover {
      background: #333;
    }
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
