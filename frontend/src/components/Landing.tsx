/** Import necessary libraries */
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

/** Constants */
const SLUG_WORKS = ["car", "dog", "computer", "person", "inside", "word", "for", "please", "to", "cool", "open", "source"];
const SERVICE_URL = "http://localhost:3001";

/** Styled components */
const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
`;

const StyledInput = styled.input`
  margin: 10px 0;
  padding: 12px 16px;
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const StyledSelect = styled.select`
  margin: 10px 0;
  padding: 12px 16px;
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
  font-size: 16px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  option {
    background: #ffffff;
    color: #1e293b;
  }
`;

const StyledButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px 0 rgba(59, 130, 246, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

/** Helper function */
function getRandomSlug() {
    let slug = "";
    for (let i = 0; i < 3; i++) {
        slug += SLUG_WORKS[Math.floor(Math.random() * SLUG_WORKS.length)];
    }
    return slug;
}

/** Component */
export const Landing = () => {
    const [language, setLanguage] = useState("node-js");
    const [replId, setReplId] = useState(getRandomSlug());
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    return (
      <Container>
        <Title>Codexa</Title>
        <StyledInput
          onChange={(e) => setReplId(e.target.value)}
          type="text"
          placeholder="Repl ID"
          value={replId}
        />
        <StyledSelect
          name="language"
          id="language"
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="node-js">Node.js</option>
          <option value="python">Python</option>
        </StyledSelect>
        <StyledButton disabled={loading} onClick={async () => {
          setLoading(true);
          await axios.post(`${SERVICE_URL}/project`, { replId, language });
          setLoading(false);
          navigate(`/coding/?replId=${replId}`)
        }}>{loading ? "Starting ..." : "Start Coding"}</StyledButton>
      </Container>
    );
}
