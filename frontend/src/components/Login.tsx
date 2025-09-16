import { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: white;
`;

const Input = styled.input`
  margin: 8px 0;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Toggle = styled.button`
  margin-top: 8px;
  background: transparent;
  color: #ddd;
  border: none;
  cursor: pointer;
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

  const submit = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = mode === 'login' ? `${INIT_SERVICE}/auth/login` : `${INIT_SERVICE}/auth/signup`;
      const body: any = { email, password };
      if (mode === 'signup') body.username = username || email.split('@')[0];
      const res = await axios.post(url, body);
      const token = res.data.token as string;
      window.localStorage.setItem('codexa_jwt', token);
      navigate('/projects');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Title>{mode === 'login' ? 'Login to Codexa' : 'Sign up for Codexa'}</Title>
      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode === 'signup' && (
        <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      )}
      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div style={{ color: 'salmon', margin: '6px 0' }}>{error}</div>}
      <Button disabled={loading} onClick={submit}>{loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Sign up')}</Button>
      <Toggle onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Create an account' : 'I already have an account'}
      </Toggle>
    </Container>
  );
};


