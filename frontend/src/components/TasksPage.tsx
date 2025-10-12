import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { TaskManager } from './TaskManager';
import { useSearchParams, useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #dbeafe 100%);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const BackButton = styled.button`
  background: #3b82f6;
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #1d4ed8;
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
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #1e293b;
  text-align: center;
`;

const LoadingText = styled.h2`
  margin: 16px 0 8px 0;
  font-size: 24px;
  font-weight: 600;
`;

const LoadingSubtext = styled.p`
  margin: 0;
  color: #64748b;
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
        <BackButton onClick={handleBackToCoding} style={{ marginTop: '24px' }}>
          Back to Coding
        </BackButton>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>Codexa - Task Manager</Logo>
        <BackButton onClick={handleBackToCoding}>
          ← Back to Coding
        </BackButton>
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
