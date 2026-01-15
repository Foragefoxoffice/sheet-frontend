import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllTasks from './pages/AllTasks';
import MyTasks from './pages/MyTasks';
import SelfTasks from './pages/SelfTasks';
import AssignedTasks from './pages/AssignedTasks';
import CreateTask from './pages/CreateTask';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import CreateUser from './pages/CreateUser';
import Users from './pages/Users';
import Departments from './pages/Departments';
import Roles from './pages/Roles';
import Profile from './pages/Profile';
import Layout from './components/layout/Layout';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line text-4xl text-primary animate-spin"></i>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <AllTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/self-tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <SelfTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assigned-tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <AssignedTasks />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-task"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateTask />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approvals"
            element={
              <ProtectedRoute>
                <Layout>
                  <Approvals />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-user"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <Users />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedRoute>
                <Layout>
                  <Departments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <Layout>
                  <Roles />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
