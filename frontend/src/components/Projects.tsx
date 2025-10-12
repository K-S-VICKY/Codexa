import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from './Input';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingOverlay } from './LoadingOverlay';
import codexaBg from '../assets/codexa-bg.svg';

const Container = styled.div`
  min-height: 100vh;
  background: 
    linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(219, 234, 254, 0.95) 100%),
    url(${codexaBg});
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  padding: 24px;
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto 32px auto;
  text-align: center;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 18px;
  margin: 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const CreateProjectCard = styled.div`
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 32px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
`;

const CreateProjectHeader = styled.h2`
  color: #1e293b;
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
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #1e293b;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 56px;
  
  &:focus {
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  option {
    background: #ffffff;
    color: #1e293b;
  }
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const ProjectCard = styled.div`
  background: #F3F4F6; /* light grey */
  border: 1px solid #E5E7EB; /* light border */
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.15);
    border-color: rgba(0, 122, 204, 0.25);
  }
`;

const ProjectName = styled.h3`
  color: #1e293b;
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
      <LoadingOverlay 
        open={!!startingProject}
        message="Lab provisioned. Getting ready…"
        minDurationMs={3500}
      />
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
