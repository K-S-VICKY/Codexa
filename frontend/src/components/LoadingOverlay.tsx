import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  background: radial-gradient(1200px 600px at 30% 20%, rgba(59, 130, 246, 0.1), transparent 40%),
    radial-gradient(900px 500px at 75% 75%, rgba(37, 99, 235, 0.08), transparent 40%),
    linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #dbeafe 100%);
  display: ${p => (p.visible ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: #1e293b;
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
  color: #3b82f6;
  text-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
  animation: ${pulse} 2.4s ease-in-out infinite;
`;

const Subtext = styled.div`
  margin-top: 8px;
  color: #64748b;
  font-size: 16px;
`;

const QuoteWrap = styled.div`
  animation: ${fadeIn} 400ms ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const QuoteText = styled.blockquote`
  position: relative;
  margin: 0 0 16px 0;
  color: #64748b;
  font-size: 36px;
  font-style: italic;
  font-weight: 500;
  font-family: inherit;
  letter-spacing: 0.3px;
  line-height: 1.4;

  &::before {
    display: block;
    color: #1e293b;
    font-size: 28px;
    line-height: 1;
    margin-bottom: 8px;
    opacity: 0.85;
  }
`;

const QuoteAuthor = styled.div`
  color: #64748b;
  font-size: 14px;
  margin-left: 2px;
`;

export interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  rotateMs?: number;
  minDurationMs?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ open, message = 'Lab provisioned. Getting ready…', rotateMs: _rotateMs = 3500, minDurationMs = 2500 }) => {
  const [index] = useState(() => {
    try {
      const key = 'codexa_quote_index';
      const existing = sessionStorage.getItem(key);
      if (existing !== null) {
        const n = parseInt(existing, 10);
        if (!Number.isNaN(n) && n >= 0 && n < QUOTES.length) return n;
      }
      const idx = getRandomQuoteIndex(QUOTES.length);
      sessionStorage.setItem(key, String(idx));
      return idx;
    } catch {
      return getRandomQuoteIndex(QUOTES.length);
    }
  });
  const quote = useMemo(() => QUOTES[index], [index]);

  // Enforce a minimum display time for the overlay
  const [visible, setVisible] = useState<boolean>(open);
  const shownAtRef = useRef<number | null>(open ? Date.now() : null);

  useEffect(() => {
    if (open) {
      shownAtRef.current = Date.now();
      setVisible(true);
      return;
    }
    // If closing, ensure min duration has passed
    const started = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - started;
    const remaining = Math.max(0, minDurationMs - elapsed);
    if (remaining === 0) {
      setVisible(false);
    } else {
      const t = setTimeout(() => setVisible(false), remaining);
      return () => clearTimeout(t);
    }
  }, [open, minDurationMs]);

  return (
    <Overlay role="status" aria-live="polite" visible={visible}>
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


