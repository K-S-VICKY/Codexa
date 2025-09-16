import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  color: white;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin: 12px 0;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const INIT_SERVICE = "http://localhost:3001";
const ORCH_SERVICE = "http://localhost:3002";

interface Project { _id: string; replId: string; language: string; }

export const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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

  const createProject = async () => {
    const res = await axios.post(`${INIT_SERVICE}/projects`, { replName, language }, { headers });
    const proj = res.data.project as Project;
    setProjects([proj, ...projects]);
  };

  const openProject = async (proj: Project) => {
    // Trigger orchestrator start, then navigate to coding
    await axios.post(`${ORCH_SERVICE}/start`, { replId: proj.replId });
    navigate(`/coding/?replId=${proj.replId}`);
  };

  if (loading) return <div>Loading…</div>;

  return (
    <Container>
      <Title>Your Projects</Title>
      <Row>
        <Input placeholder="Project name" value={replName} onChange={(e) => setReplName(e.target.value)} />
        <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="node-js">Node.js</option>
          <option value="python">Python</option>
        </Select>
        <Button onClick={createProject}>Create</Button>
      </Row>
      <div>
        {projects.length === 0 ? (
          <div style={{ color: '#ddd' }}>No projects yet</div>
        ) : (
          projects.map((p) => (
            <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ color: 'white' }}>{p.replId} <span style={{ color: '#999' }}>({p.language})</span></div>
              <Button onClick={() => openProject(p)}>Open</Button>
            </div>
          ))
        )}
      </div>
    </Container>
  );
};


