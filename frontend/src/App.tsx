import './App.css'
import { CodingPage } from './components/CodingPage'
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
// import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Projects } from './components/Projects';
import { TasksPage } from './components/TasksPage';

const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/projects', element: <Projects /> },
  { path: '/coding', element: <CodingPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/', element: <Navigate to="/login" replace /> },
]);

function App() {
  const futureFlags = ({
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  } as unknown) as any;
  return (
    <RouterProvider
      router={router}
      future={futureFlags}
    />
  )
}

export default App
