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
import CreatePost from './pages/CreatePost.tsx'
import Moodboard from './pages/Moodboard.tsx'
import Pricing from './pages/Pricing.tsx'
import SubscriptionPage from './pages/Subscription.tsx'
import Templates from './pages/Templates.tsx'

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
        <Route path="/create" element={<CreatePost />} />
        <Route path="/moodboard" element={<Moodboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/templates" element={<Templates />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)