import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Onboarding from './pages/Onboarding.tsx'
import CalendarPage from './pages/Calendar.tsx'
import GeneratePost from './pages/GeneratePost.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/generate" element={<GeneratePost />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)