import { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from './Input';
import { Button } from './Button';
import codexaBg from '../assets/codexa-bg.svg';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: 
    linear-gradient(135deg, rgba(15, 15, 35, 0.85) 0%, rgba(26, 26, 46, 0.85) 50%, rgba(22, 33, 62, 0.85) 100%),
    url(${codexaBg});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 20px;
  position: relative;
  overflow: hidden;
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

const FloatingCode = styled.div<{ x: number; y: number; delay: number; size: number }>`
  position: absolute;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: ${props => props.size}px;
  color: rgba(99, 102, 241, 0.1);
  animation: float ${props => 8 + props.delay}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  user-select: none;
  
  @keyframes float {
    0%, 100% { 
      opacity: 0.1; 
      transform: translateY(0px) rotate(0deg); 
    }
    50% { 
      opacity: 0.05; 
      transform: translateY(-20px) rotate(5deg); 
    }
  }
`;

const Orb = styled.div<{ size: number; x: number; y: number; delay: number }>`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%);
  border-radius: 50%;
  left: ${props => props.x}%;
  top: ${props => props.y}%;
  animation: pulse ${props => 4 + props.delay}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  filter: blur(1px);
  
  @keyframes pulse {
    0%, 100% { 
      opacity: 0.8; 
      transform: scale(1) translateY(0px); 
    }
    50% { 
      opacity: 0.4; 
      transform: scale(1.2) translateY(-10px); 
    }
  }
`;

const LoginCard = styled.div`
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 420px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(99, 102, 241, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
    border-radius: 24px;
    z-index: -1;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const Logo = styled.div`
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #90f163ff 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  color: #e2e8f0;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-size: 16px;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ErrorMessage = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  margin: 8px 0;
  text-align: center;
`;

const ToggleContainer = styled.div`
  text-align: center;
  margin-top: 24px;
`;

const ToggleText = styled.span`
  color: #94a3b8;
  font-size: 14px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #6366f1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #8b5cf6;
    text-decoration: underline;
  }
`;

const INIT_SERVICE = "http://localhost:3001";

export const Login = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const url = mode === 'login' ? `${INIT_SERVICE}/auth/login` : `${INIT_SERVICE}/auth/signup`;
      const body: any = { email, password };
      if (mode === 'signup') body.username = username || email.split('@')[0];
      const res = await axios.post(url, body);
      const token = res.data.token as string;
      const user = res.data.user;
      
      window.localStorage.setItem('codexa_jwt', token);
      if (user) {
        window.localStorage.setItem('codexa_user', JSON.stringify(user));
      }
      navigate('/projects');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <BackgroundOrbs>
        <Orb size={200} x={10} y={20} delay={0} />
        <Orb size={150} x={80} y={10} delay={1} />
        <Orb size={180} x={70} y={70} delay={2} />
        <Orb size={120} x={20} y={80} delay={1.5} />
        
        <FloatingCode x={15} y={25} delay={0} size={12}>const</FloatingCode>
        <FloatingCode x={85} y={15} delay={1} size={10}>function</FloatingCode>
        <FloatingCode x={75} y={75} delay={2} size={14}>return</FloatingCode>
        <FloatingCode x={25} y={85} delay={1.5} size={11}>import</FloatingCode>
        <FloatingCode x={50} y={10} delay={0.5} size={9}>export</FloatingCode>
        <FloatingCode x={90} y={60} delay={2.5} size={13}>async</FloatingCode>
        <FloatingCode x={5} y={60} delay={1.8} size={10}>await</FloatingCode>
        <FloatingCode x={60} y={90} delay={3} size={12}>useState</FloatingCode>
      </BackgroundOrbs>
      
      <LoginCard>
        <Header>
          <Logo>Codexa</Logo>
          <Title>{mode === 'login' ? 'Welcome back' : 'Create account'}</Title>
          <Subtitle>
            {mode === 'login' 
              ? 'Sign in to your account to continue' 
              : 'Join thousands of developers building amazing projects'
            }
          </Subtitle>
        </Header>

        <Form onSubmit={submit}>
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {mode === 'signup' && (
            <Input
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              helperText="Leave empty to use email prefix"
            />
          )}
          
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            style={{ marginTop: '16px' }}
          >
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </Form>

        <ToggleContainer>
          <ToggleText>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </ToggleText>
          <ToggleButton onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </ToggleButton>
        </ToggleContainer>
      </LoginCard>
    </Container>
  );
};
