import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { QUOTES, getRandomQuoteIndex } from '../assets/quotes';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.75; }
`;

const Overlay = styled.div<{ visible: boolean }>`
  position: fixed;
  inset: 0;
  background: radial-gradient(1200px 600px at 30% 20%, rgba(32, 45, 80, 0.35), transparent 40%),
    radial-gradient(900px 500px at 75% 75%, rgba(62, 28, 120, 0.3), transparent 40%),
    linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #0f172a 100%);
  display: ${p => (p.visible ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: #e2e8f0;
`;

const Wrap = styled.div`
  width: min(100%, 1080px);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  padding: 24px;
  align-items: center;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 24px;
  }
`;

const Loader = styled.div`
  position: relative;
  width: 420px;
  height: 420px;
  margin: 0 auto;
`;

const Ring = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(99, 102, 241, 0.15);
  box-shadow: inset 0 0 60px rgba(99, 102, 241, 0.08);
  &::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border-top: 4px solid #00d1ff;
    border-right: 4px solid transparent;
    border-bottom: 4px solid #6d28d9;
    border-left: 4px solid transparent;
    filter: drop-shadow(0 0 12px rgba(0, 209, 255, 0.6));
    animation: ${spin} 3.6s linear infinite;
  }
`;

const CenterText = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
`;

const LoadingWord = styled.div`
  font-size: 56px;
  letter-spacing: 1px;
  color: #7dd3fc;
  text-shadow: 0 0 12px rgba(125, 211, 252, 0.35);
  animation: ${pulse} 2.4s ease-in-out infinite;
`;

const Subtext = styled.div`
  margin-top: 8px;
  color: #9ca3af;
  font-size: 16px;
`;

const QuoteWrap = styled.div`
  animation: ${fadeIn} 400ms ease;
`;

const QuoteText = styled.blockquote`
  margin: 0 0 12px 0;
  color: #cbd5e1;
  font-size: 26px;
  font-style: italic;
  line-height: 1.5;
`;

const QuoteAuthor = styled.div`
  color: #94a3b8;
  font-size: 16px;
`;

export interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  rotateMs?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message = 'Lab provisioned. Getting ready…', rotateMs: _rotateMs = 3500 }) => {
  const [index] = useState(() => getRandomQuoteIndex(QUOTES.length));
  const quote = useMemo(() => QUOTES[index], [index]);

  return (
    <Overlay role="status" aria-live="polite" visible={open}>
      <Wrap>
        <Loader>
          <Ring />
          <CenterText>
            <div>
              <LoadingWord>Loading</LoadingWord>
              <Subtext>{message}</Subtext>
            </div>
          </CenterText>
        </Loader>
        <QuoteWrap>
          <QuoteText>“{quote.text}”</QuoteText>
          <QuoteAuthor>— {quote.author}</QuoteAuthor>
        </QuoteWrap>
      </Wrap>
    </Overlay>
  );
};


