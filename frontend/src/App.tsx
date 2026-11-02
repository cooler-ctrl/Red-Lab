import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './features/dashboard/DashboardPage';
import EditorPage from './features/editor/EditorPage';
import ScenariosPage from './features/scenarios/ScenariosPage';
import { ToastProvider } from './components/Toast';

const AcademyDashboard = lazy(async () => ({ default: (await import('./features/academy/AcademyDashboard')).AcademyDashboard }));
const AcademyCoursePage = lazy(async () => ({ default: (await import('./features/academy/AcademyCoursePage')).AcademyCoursePage }));
const AcademyLessonPage = lazy(async () => ({ default: (await import('./features/academy/AcademyLessonPage')).AcademyLessonPage }));
const AcademyStartExamPage = lazy(async () => ({ default: (await import('./features/academy/AcademyExamPage')).AcademyStartExamPage }));
const AcademyExamPage = lazy(async () => ({ default: (await import('./features/academy/AcademyExamPage')).AcademyExamPage }));
const AcademyCertificatePage = lazy(async () => ({ default: (await import('./features/academy/AcademyCertificatePage')).AcademyCertificatePage }));

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#0B0D12] text-sm text-[#9BA5B5]">Loading RED-Lab…</div>}>{children}</Suspense>;
}

function AcademyRoute({ children }: { children: ReactNode }) {
  useEffect(() => {
    const body = document.body;
    const wasScrollLocked = body.classList.contains('overflow-hidden');
    body.classList.remove('overflow-hidden');
    return () => {
      if (wasScrollLocked) body.classList.add('overflow-hidden');
    };
  }, []);
  return <LazyRoute>{children}</LazyRoute>;
}

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/lab/:labId" element={<EditorPage />} />
          <Route path="/academy" element={<AcademyRoute><AcademyDashboard /></AcademyRoute>} />
          <Route path="/academy/courses/:courseId" element={<AcademyRoute><AcademyCoursePage /></AcademyRoute>} />
          <Route path="/academy/courses/:courseId/lessons/:lessonId" element={<AcademyRoute><AcademyLessonPage /></AcademyRoute>} />
          <Route path="/academy/courses/:courseId/exam" element={<AcademyRoute><AcademyStartExamPage /></AcademyRoute>} />
          <Route path="/academy/exams/:attemptId" element={<AcademyRoute><AcademyExamPage /></AcademyRoute>} />
          <Route path="/academy/certificates/:certificateId" element={<AcademyRoute><AcademyCertificatePage /></AcademyRoute>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
