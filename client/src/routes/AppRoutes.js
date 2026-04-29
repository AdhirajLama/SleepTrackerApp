import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from '../components/auth/RequireAuth';
import SignUp from '../components/account/SignUp';
import LogIn from '../components/account/LogIn';
import Logout from '../components/account/Logout';
import Dashboard from '../components/sleep/Dashboard';
import SleepEntryForm from '../components/sleep/SleepEntryForm';
import SleepAdvice from '../components/sleep/SleepAdvice';

function RootRedirect() {
  const token = localStorage.getItem('token');
  return <Navigate to={token ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<LogIn />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/new-sleep-entry"
        element={
          <RequireAuth>
            <SleepEntryForm />
          </RequireAuth>
        }
      />
      <Route
        path="/sleep-advice"
        element={
          <RequireAuth>
            <SleepAdvice />
          </RequireAuth>
        }
      />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  );
}

export default AppRoutes;
