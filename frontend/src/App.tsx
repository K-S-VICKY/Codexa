import './App.css'
import { CodingPage } from './components/CodingPage'
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Projects } from './components/Projects';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/coding" element={<CodingPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
