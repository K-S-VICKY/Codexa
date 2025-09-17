import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
`;

const wave = keyframes`
  0%, 60%, 100% { transform: initial; }
  30% { transform: translateY(-15px); }
`;

const Container = styled.div<{ variant: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.variant === 'fullscreen' ? '100vh' : '200px'};
  background: ${props => props.variant === 'fullscreen' ? 
    'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)' : 'transparent'};
  position: relative;
  overflow: hidden;
`;

const SpinnerContainer = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(99, 102, 241, 0.1);
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border: 2px solid transparent;
    border-top: 2px solid rgba(139, 92, 246, 0.6);
    border-radius: 50%;
    animation: ${spin} 2s linear infinite reverse;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6);
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out infinite both;
  animation-delay: ${props => props.delay}s;
`;

const WaveContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
`;

const WaveBar = styled.div<{ delay: number }>`
  width: 4px;
  height: 30px;
  background: linear-gradient(to top, #6366f1, #8b5cf6);
  border-radius: 2px;
  animation: ${wave} 1.2s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const LoadingText = styled.div`
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  animation: ${pulse} 2s ease-in-out infinite;
  margin-bottom: 12px;
`;

const SubText = styled.div`
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  max-width: 300px;
  line-height: 1.5;
`;

const BackgroundOrbs = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const Orb = styled.div<{ size: number; x: number; y: number; delay: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  animation: ${pulse} ${props => 3 + props.delay}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

interface LoadingSpinnerProps {
  variant?: 'spinner' | 'dots' | 'wave' | 'fullscreen';
  text?: string;
  subText?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  variant = 'spinner', 
  text = 'Loading...',
  subText 
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <DotsContainer>
            {[0, 1, 2].map(i => (
              <Dot key={i} delay={i * 0.16} />
            ))}
          </DotsContainer>
        );
      case 'wave':
        return (
          <WaveContainer>
            {[0, 1, 2, 3, 4].map(i => (
              <WaveBar key={i} delay={i * 0.1} />
            ))}
          </WaveContainer>
        );
      default:
        return (
          <SpinnerContainer>
            <Spinner />
          </SpinnerContainer>
        );
    }
  };

  return (
    <Container variant={variant}>
      {variant === 'fullscreen' && (
        <BackgroundOrbs>
          <Orb size={120} x={10} y={20} delay={0} />
          <Orb size={80} x={80} y={10} delay={1} />
          <Orb size={100} x={70} y={70} delay={2} />
          <Orb size={60} x={20} y={80} delay={1.5} />
        </BackgroundOrbs>
      )}
      {renderLoader()}
      <LoadingText>{text}</LoadingText>
      {subText && <SubText>{subText}</SubText>}
    </Container>
  );
};
