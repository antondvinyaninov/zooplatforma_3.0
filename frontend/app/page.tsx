import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import MainLayout from './main/(main)/layout';
import Home from './main/(main)/page';

type Props = {
  searchParams: Promise<{ metka?: string }>;
};

export default async function RootPage(props: Props) {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout>{await Home(props)}</MainLayout>
      </ToastProvider>
    </AuthProvider>
  );
}
