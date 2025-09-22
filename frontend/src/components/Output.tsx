import { useSearchParams } from "react-router-dom";
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

const OutputContainer = styled.div`
  height: 40vh;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const OutputFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 20px;
`;

interface OutputProps {
  port: number;
}

export const Output: React.FC<OutputProps> = ({ port }) => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const { socket } = useSocket(replId);
    const [isForwarding, setIsForwarding] = useState(false);
    const [forwardError, setForwardError] = useState<string | null>(null);
    const [frameUrl, setFrameUrl] = useState<string | null>(null);
    
    useEffect(() => {
        if (!socket || !port) return;
        
        // Clear previous state when port changes
        setIsForwarding(true);
        setForwardError(null);
        setFrameUrl(null);
        
        // Add a small delay to ensure previous connections are cleaned up
        const setupTimeout = setTimeout(() => {
            // Check if port is available and forward it
            socket.emit("checkPort", { port }, (response: any) => {
                if (response.available) {
                    setForwardError("No service running on this port. Make sure your development server is running.");
                    setIsForwarding(false);
                    return;
                }
                
                // Port is in use, try to forward it
                socket.emit("forwardPort", { port }, (response: any) => {
                    if (response.success) {
                        // Use HTTP subdomain-based routing for each port (no TLS for now)
                        const url = `http://${replId}-${port}.vigneshks.tech?t=${Date.now()}`;
                        setFrameUrl(url);
                        setIsForwarding(false);
                    } else {
                        setForwardError(response.error || "Failed to forward port");
                        setIsForwarding(false);
                    }
                });
            });
        }, 500);
        
        // Cleanup port forward on unmount or port change
        return () => {
            clearTimeout(setupTimeout);
            if (socket) {
                socket.emit("stopPortForward", { port });
            }
        };
    }, [socket, port, replId]);

    return (
        <OutputContainer>
            {isForwarding && (
                <LoadingOverlay>
                    Setting up port forwarding for port {port}...
                </LoadingOverlay>
            )}
            {forwardError && (
                <ErrorMessage>
                    <div>❌ Port Forward Error</div>
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                        {forwardError}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
                        Try running your development server (e.g., npm run dev) in the terminal first.
                    </div>
                </ErrorMessage>
            )}
            {frameUrl && !isForwarding && !forwardError && (
                <OutputFrame src={frameUrl} />
            )}
        </OutputContainer>
    );
}