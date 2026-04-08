import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ContentDetail from './pages/ContentDetail';
import GazetteEditor from './pages/GazetteEditor';
import UserProfile from './pages/UserProfile';
import RubriqueDetail from './pages/RubriqueDetail';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { loading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <ProtectedRoute>
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            </ProtectedRoute>
          }
        />
      ))}
      
      {/* Content detail route */}
      <Route path="/content/:id" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="ContentDetail">
            <ContentDetail />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      {/* Gazette detail and edit routes */}
      <Route path="/gazette/:id" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="GazetteEditor">
            <GazetteEditor />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      <Route path="/gazette/:id/edit" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="GazetteEditor">
            <GazetteEditor />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      {/* User profile route */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="UserProfile">
            <UserProfile />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      {/* Rubrique detail route */}
      <Route path="/rubriques/:id" element={
        <ProtectedRoute>
          <LayoutWrapper currentPageName="RubriqueDetail">
            <RubriqueDetail />
          </LayoutWrapper>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
