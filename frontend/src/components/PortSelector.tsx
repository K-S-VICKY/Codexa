import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';
import { useSocket } from '../hooks/useSocket';
import { useSearchParams } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #F3F4F6;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #E5E7EB;
  min-width: 400px;
  max-width: 500px;
  color: #1E293B;
`;

const Title = styled.h2`
  color: #1E293B;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: #64748B;
  font-size: 14px;
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const PortGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 24px;
`;

const PortRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PortButton = styled.button<{ selected: boolean }>`
  background: ${props => props.selected
    ? 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #3b82f6, #8b5cf6) border-box'
    : '#FFFFFF'};
  border: ${props => props.selected ? '2px solid transparent' : '1px solid #D1D5DB'};
  border-radius: 12px;
  padding: 16px 12px;
  color: #000000;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;

  &:hover {
    transform: translateY(-2px);
    background: ${props => props.selected
      ? 'linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #0090FF, #7c3aed) border-box'
      : '#FFFFFF'};
    border-color: ${props => props.selected ? 'transparent' : '#9CA3AF'};
  }

  &:active {
    transform: translateY(0);
  }
`;

const PortInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const PortNumber = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const KillButton = styled.button<{ killing?: boolean }>`
  background: ${props => props.killing ? '#dc2626' : 'rgba(220, 38, 38, 0.1)'};
  border: 1px solid ${props => props.killing ? '#dc2626' : '#dc2626'};
  border-radius: 8px;
  padding: 8px 12px;
  color: ${props => props.killing ? '#ffffff' : '#dc2626'};
  font-size: 12px;
  font-weight: 600;
  cursor: ${props => props.killing ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.killing ? 0.7 : 1};
  
  &:hover {
    background: ${props => props.killing ? '#dc2626' : 'rgba(220, 38, 38, 0.2)'};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PortLabel = styled.div`
  font-size: 12px;
  opacity: 0.8;
  font-weight: 400;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;


interface PortSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPort: (port: number) => void;
  currentPort?: number;
}

const PREDEFINED_PORTS = [
  { port: 5173, label: 'Vite Dev' },
  { port: 5174, label: 'Vite Preview' },
  { port: 8000, label: 'Python/Django' },
  { port: 5000, label: 'Flask/Custom' },
  { port: 8080, label: 'HTTP Server' },
  { port: 8081, label: 'Alt HTTP' }
];

export const PortSelector: React.FC<PortSelectorProps> = ({ 
  isOpen, 
  onClose, 
  onSelectPort, 
  currentPort 
}) => {
  const [selectedPort, setSelectedPort] = useState<number>(currentPort || 5173);
  const [killingPorts, setKillingPorts] = useState<Set<number>>(new Set());
  const [searchParams] = useSearchParams();
  const replId = searchParams.get('replId') ?? '';
  const { socket } = useSocket(replId);

  if (!isOpen) return null;

  const handlePortSelect = (port: number) => {
    setSelectedPort(port);
  };

  const handleConfirm = () => {
    onSelectPort(selectedPort);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKillPort = (port: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!socket || killingPorts.has(port)) return;
    
    setKillingPorts(prev => new Set(prev).add(port));
    
    socket.emit('killPort', { port }, (response: any) => {
      setKillingPorts(prev => {
        const newSet = new Set(prev);
        newSet.delete(port);
        return newSet;
      });
      
      if (response.success) {
        console.log(`Successfully killed processes on port ${port}`);
      } else {
        console.error(`Failed to kill processes on port ${port}:`, response.error);
      }
    });
  };

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <Title>Select Port</Title>
        <Subtitle>
          Choose which port to preview in the output window. Select from available development ports.
        </Subtitle>
        
        <PortGrid>
          {PREDEFINED_PORTS.map(({ port, label }) => (
            <PortRow key={port}>
              <PortButton
                selected={selectedPort === port}
                onClick={() => handlePortSelect(port)}
              >
                <PortInfo>
                  <PortNumber>{port}</PortNumber>
                  <PortLabel>{label}</PortLabel>
                </PortInfo>
              </PortButton>
              <KillButton
                killing={killingPorts.has(port)}
                disabled={killingPorts.has(port)}
                onClick={(e) => handleKillPort(port, e)}
                title={`Kill processes running on port ${port}`}
              >
                {killingPorts.has(port) ? '🔄 Killing...' : '🔪 Kill'}
              </KillButton>
            </PortRow>
          ))}
        </PortGrid>

        <ButtonRow>
          <Button variant="gradientOutline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gradientOutline" size="sm" onClick={handleConfirm}>
            Open Port {selectedPort} in New Tab
          </Button>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
};
