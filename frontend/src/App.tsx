import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastContainer } from '@/components/ui/Toast';
import { AppRoutes } from '@/routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <div className="flex min-h-screen flex-col bg-[var(--paper)] text-[var(--ink)] antialiased transition-colors">
              <Header />
              <main className="flex-1">
                <AppRoutes />
              </main>
              <Footer />
              <ToastContainer />
            </div>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
export default App;
