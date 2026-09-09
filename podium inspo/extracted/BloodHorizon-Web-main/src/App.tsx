import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/lib/auth';
import Home from '@/pages/Home';
import Leaderboards from '@/pages/Leaderboards';
import Link from '@/pages/Link';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import Servers from '@/pages/Servers';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/leaderboard" element={<Leaderboards />} />
            <Route path="/link" element={<Link />} />
            <Route
              path="/profile"
              element={(
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              )}
            />
            <Route path="/stats/:steamId" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
