import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const languages = [
  { value: 'c', label: 'C' },
  { value: 'javascript', label: 'Node.js (JavaScript)' },
  { value: 'python', label: 'Python' }
];

function CodeRunner() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const runCode = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('http://localhost:3001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await res.json();
      setOutput(data.output);
    } catch (err) {
      setOutput('Error connecting to backend.');
    }
    setLoading(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ marginRight: 12, padding: 4 }}>
          {languages.map(lang => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
        <button onClick={runCode} disabled={loading} style={{ padding: '6px 18px', borderRadius: 4, background: '#5e3083', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          {loading ? 'Running...' : 'Run'}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, marginBottom: 12 }}>
        <MonacoEditor
          height="100%"
          width="100%"
          language={language === 'c' ? 'c' : language}
          value={code}
          onChange={value => setCode(value)}
          theme="vs-dark"
        />
      </div>
      <div style={{ background: '#23272e', color: '#fff', borderRadius: 8, padding: 12, minHeight: 60, fontFamily: 'Fira Mono, Consolas, Menlo, Monaco, monospace', fontSize: 16 }}>
        <strong>Output:</strong>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
      </div>
    </div>
  );
}

export default CodeRunner; 