import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public Pages
import HomePage from './pages/Public/HomePage'

// Auth Pages
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'

// Student Pages
import StudentDashboard from './pages/Student/DashboardPage'
import ProfilePage from './pages/Student/ProfilePage'

import AdminDashboard from './pages/Admin/AdminDashboard'
import PendingQuestionsPage from './pages/Admin/PendingQuestionsPage'
import QuestionPoolPage from './pages/Admin/QuestionPoolPage'
import CategoriesPage from './pages/Admin/CategoriesPage'
import FAQManagementPage from './pages/Admin/FAQManagementPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
      
        <Route path="/" element={<HomePage />} />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<ProfilePage />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/faq-management" element={<FAQManagementPage />} />
        <Route path="/admin/pending-questions" element={<PendingQuestionsPage />} />
        <Route path="/admin/question-pool" element={<QuestionPoolPage />} />
        <Route path="/admin/categories" element={<CategoriesPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App