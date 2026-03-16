import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import MainLayout from '../main/(main)/layout';
import MessengerPage from '../main/(main)/messenger/page';

export default function RootMessengerPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout>
          <MessengerPage />
        </MainLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
