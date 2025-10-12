import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { TaskManager } from './TaskManager';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.75) 0%, rgba(139, 92, 246, 0.75) 100%);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
  line-height: 36px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%);
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const TaskManagerContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  height: calc(100vh - 120px);
  background: #1e1e1e;
  border-radius: 8px;
  border: 1px solid #3e3e42;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #ffffff;
  text-align: center;
`;

const LoadingText = styled.h2`
  margin: 16px 0 8px 0;
  font-size: 24px;
  font-weight: 600;
`;

const LoadingSubtext = styled.p`
  margin: 0;
  color: #888;
  font-size: 16px;
`;

export const TasksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get project ID from URL params
    const replId = searchParams.get('replId');
    setProjectId(replId || undefined);

    // Get user info from localStorage
    const token = localStorage.getItem('codexa_jwt');
    const userInfo = localStorage.getItem('codexa_user');
    
    if (token) {
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setUserId(user.id || user._id || 'mock-user-id');
        } catch (error) {
          console.error('Failed to parse user info:', error);
          setUserId('mock-user-id');
        }
      } else {
        setUserId('mock-user-id');
      }
    }

    setLoading(false);
  }, [searchParams]);

  const handleBackToCoding = () => {
    const replId = searchParams.get('replId');
    if (replId) {
      navigate(`/coding?replId=${replId}`);
    } else {
      navigate('/projects');
    }
  };

  if (loading) {
    return (
      <LoadingContainer>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <LoadingText>Loading Task Manager...</LoadingText>
        <LoadingSubtext>Setting up your task management workspace</LoadingSubtext>
      </LoadingContainer>
    );
  }

  if (!projectId || !userId) {
    return (
      <LoadingContainer>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <LoadingText>Missing Information</LoadingText>
        <LoadingSubtext>
          Project ID: {projectId || 'Not found'} | User ID: {userId || 'Not found'}
        </LoadingSubtext>
        <BackButton onClick={handleBackToCoding} style={{ marginTop: '24px' }} aria-label="Back">
          ←
        </BackButton>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBackToCoding} aria-label="Back">
          ←
        </BackButton>
        <Logo>Codexa - Task Manager</Logo>
      </Header>
      
      <Content>
        <TaskManagerContainer>
          <TaskManager 
            projectId={projectId} 
            userId={userId}
          />
        </TaskManagerContainer>
      </Content>
    </Container>
  );
};
