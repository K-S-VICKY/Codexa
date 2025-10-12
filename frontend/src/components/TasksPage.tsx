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
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
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
  appearance: none;
  background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #8b5cf6, #22d3ee);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  border: 2px solid transparent;
  color: #111827;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.05s ease, background-color 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(rgba(0, 122, 204, 0.08), rgba(0, 122, 204, 0.08)) padding-box,
                linear-gradient(135deg, #0090FF, #7c3aed) border-box;
  }

  &:active { transform: translateY(1px); }
`;

const Content = styled.div`
  flex: 1;
  padding: 0;
  display: flex;
  justify-content: stretch;
  align-items: stretch;
`;

const TaskManagerContainer = styled.div`
  width: 100%;
  height: calc(100vh - 80px);
  background: #ffffff;
  border-radius: 0;
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: none;
  overflow: hidden;
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
        <BackButton onClick={handleBackToCoding} style={{ marginTop: '24px' }} aria-label="Back">
          ←
        </BackButton>
      </LoadingContainer>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBackToCoding} aria-label="Back">← Back</BackButton>
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
