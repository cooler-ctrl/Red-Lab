import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/editor/EditorPage';
import { ToastProvider } from './components/Toast';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lab/:labId" element={<EditorPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
