import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/index';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TestListPage from './pages/TestListPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useSelector((s: any) => s.auth.isAuth);
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tests" element={
          <ProtectedRoute><TestListPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
}