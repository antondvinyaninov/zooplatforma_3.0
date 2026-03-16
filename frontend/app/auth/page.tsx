import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import AuthPage from '../main/auth/page';

export default function RootAuthPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthPage />
      </ToastProvider>
    </AuthProvider>
  );
}
