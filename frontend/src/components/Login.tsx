import { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from './Input';
import { Button } from './Button';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:white;

  padding: 20px;
  position: relative;
  overflow: hidden;
`;


const LoginCard = styled.div`
  background: white;
  backdrop-filter: blur(25px);
  border: 1px solid rgb(239, 237, 237);
  border-radius: 24px;
  padding: 56px;
  width: 100%;
  max-width: 520px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(59, 130, 246, 0.1),
    inset 0 1px 0 rgba(19, 57, 140, 0.8);
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%);
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
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  color: #64748b;
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
  color: #64748b;
  font-size: 14px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s ease;
  
  &:hover {
    color: #1d4ed8;
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
      {/* Background orbs removed for plain background */}
      
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
