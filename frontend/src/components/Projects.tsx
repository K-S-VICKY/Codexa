import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from './Input';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  padding: 24px;
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto 32px auto;
  text-align: center;
`;

const Title = styled.h1`
  color: #e2e8f0;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-size: 18px;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const CreateProjectCard = styled.div`
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
`;

const CreateProjectHeader = styled.h2`
  color: #e2e8f0;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 24px 0;
`;

const CreateProjectForm = styled.form`
  display: flex;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  min-width: 200px;
`;

const Select = styled.select`
  width: 100%;
  padding: 16px 16px 8px 16px;
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  color: #e2e8f0;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 56px;
  
  &:focus {
    border-color: #6366f1;
    background: rgba(15, 23, 42, 0.8);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(148, 163, 184, 0.4);
  }
  
  option {
    background: #1e293b;
    color: #e2e8f0;
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const ProjectCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
    border-color: rgba(99, 102, 241, 0.3);
  }
`;

const ProjectName = styled.h3`
  color: #e2e8f0;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const ProjectMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const LanguageBadge = styled.span`
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
`;

const ProjectId = styled.span`
  color: #64748b;
  font-size: 14px;
  font-family: 'Monaco', 'Menlo', monospace;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
  color: #64748b;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.p`
  font-size: 18px;
  margin: 0;
`;

const INIT_SERVICE = "http://localhost:3001";
const ORCH_SERVICE = "http://localhost:3002";

interface Project { _id: string; replId: string; language: string; }

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [replName, setReplName] = useState('');
  const [language, setLanguage] = useState('node-js');
  const navigate = useNavigate();

  const token = window.localStorage.getItem('codexa_jwt') || '';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${INIT_SERVICE}/projects`, { headers });
        setProjects(res.data.projects || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replName.trim()) return;
    
    try {
      setCreating(true);
      const res = await axios.post(`${INIT_SERVICE}/projects`, { replName, language }, { headers });
      const proj = res.data.project as Project;
      setProjects([proj, ...projects]);
      setReplName('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const [startingProject, setStartingProject] = useState<string | null>(null);

  const openProject = async (proj: Project) => {
    try {
      setStartingProject(proj.replId);
      // Trigger orchestrator start, then navigate to coding
      await axios.post(`${ORCH_SERVICE}/start`, { replId: proj.replId });
      navigate(`/coding/?replId=${proj.replId}`);
    } catch (error) {
      console.error('Failed to start project:', error);
      setStartingProject(null);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner 
        variant="fullscreen" 
        text="Loading your projects..." 
        subText="Fetching your development environments"
      />
    );
  }

  return (
    <Container>
      <Header>
        <Title>Your Projects</Title>
        <Subtitle>Manage and access your development environments</Subtitle>
      </Header>
      
      <Content>
        <CreateProjectCard>
          <CreateProjectHeader>Create New Project</CreateProjectHeader>
          <CreateProjectForm onSubmit={createProject}>
            <InputGroup>
              <Input
                label="Project name"
                value={replName}
                onChange={(e) => setReplName(e.target.value)}
                required
              />
            </InputGroup>
            <InputGroup style={{ minWidth: '160px', maxWidth: '200px' }}>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="node-js">Node.js</option>
                <option value="python">Python</option>
              </Select>
            </InputGroup>
            <Button 
              type="submit"
              variant="primary" 
              size="lg"
              isLoading={creating}
              disabled={!replName.trim()}
            >
              Create Project
            </Button>
          </CreateProjectForm>
        </CreateProjectCard>

        {projects.length === 0 ? (
          <EmptyState>
            <EmptyStateIcon>🚀</EmptyStateIcon>
            <EmptyStateText>No projects yet. Create your first project to get started!</EmptyStateText>
          </EmptyState>
        ) : (
          <ProjectsGrid>
            {projects.map((project) => (
              <ProjectCard 
                key={project._id} 
                onClick={() => startingProject !== project.replId && openProject(project)}
                style={{ 
                  opacity: startingProject === project.replId ? 0.7 : 1,
                  cursor: startingProject === project.replId ? 'wait' : 'pointer'
                }}
              >
                <ProjectName>{project.replId}</ProjectName>
                <ProjectMeta>
                  <LanguageBadge>{project.language}</LanguageBadge>
                  <ProjectId>#{project._id.slice(-6)}</ProjectId>
                </ProjectMeta>
                {startingProject === project.replId ? (
                  <Button variant="ghost" size="sm" style={{ width: '100%' }} disabled>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <LoadingSpinner variant="dots" />
                      Starting Pod...
                    </div>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" style={{ width: '100%' }}>
                    Open Project →
                  </Button>
                )}
              </ProjectCard>
            ))}
          </ProjectsGrid>
        )}
      </Content>
    </Container>
  );
};
