import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { useAuth } from './auth/auth-context';
import { AppLayout } from './components/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { HomePage } from './pages/Home';
import { InvitePage } from './pages/Invite';
import { LoginPage } from './pages/Login';
import { NotFoundPage } from './pages/NotFound';
import { ProjectPage } from './pages/Project';
import { RegisterPage } from './pages/Register';

function TodoRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/p/${id ?? ''}`} replace />;
}

function NotesRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/p/${id ?? ''}#notas`} replace />;
}

export default function App() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/p/:id" element={<ProjectPage />} />
        <Route path="/p/:id/todo" element={<TodoRedirect />} />
        <Route path="/p/:id/notes" element={<NotesRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
