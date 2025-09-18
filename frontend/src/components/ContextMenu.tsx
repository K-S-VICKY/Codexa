import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

export interface ContextMenuItem {
  label?: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, items }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <MenuContainer ref={menuRef} x={x} y={y}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.separator ? (
            <Separator />
          ) : (
            <MenuItem
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.onClick) {
                  item.onClick();
                  onClose();
                }
              }}
            >
              {item.icon && <Icon>{item.icon}</Icon>}
              <Label>{item.label}</Label>
            </MenuItem>
          )}
        </React.Fragment>
      ))}
    </MenuContainer>
  );
};

const MenuContainer = styled.div<{ x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  background: #2d2d30;
  border: 1px solid #454545;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 180px;
  padding: 4px 0;
  font-size: 13px;
  color: #cccccc;
`;

const MenuItem = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    background: ${props => props.disabled ? 'transparent' : '#094771'};
  }
`;

const Icon = styled.span`
  margin-right: 8px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.span`
  flex: 1;
`;

const Separator = styled.div`
  height: 1px;
  background: #454545;
  margin: 4px 0;
`;
