import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, CssBaseline, Button } from '@mui/material';
import { SleepProvider } from './context/SleepContext';
import logo from './208778712.png';
import SignUp from './components/SignUp';
import LogIn from './components/LogIn';
import Dashboard from './components/Dashboard';
import SleepEntryForm from './components/SleepEntryForm';
import Logout from './components/Logout';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

class App extends Component {
  render() {
    const isAuthenticated = !!localStorage.getItem('token');

    return (
      <ErrorBoundary>
        <SleepProvider>
          <Router>
            <CssBaseline />
            <div className="app-logo-container">
              <img src={logo} alt="logo" className="app-logo-large" />
              <Typography variant="h4" className="welcome-text">Welcome to Your Sleep Tracker!</Typography>
            </div>
            <AppBar position="static" className="app-bar">
              <Toolbar>
                <Typography variant="h6" className="app-title">Sleep Tracker</Typography>
                <Button color="inherit" component={Link} to="/signup">Sign Up</Button>
                <Button color="inherit" component={Link} to="/login">Log In</Button>
                <Button color="inherit" component={Link} to="/dashboard">Dashboard</Button>
                <Button color="inherit" component={Link} to="/new-sleep-entry">Sleep Data</Button>
                {isAuthenticated && <Button color="inherit" component={Link} to="/logout">Log Out</Button>}
              </Toolbar>
            </AppBar>
            <Container className="content">
              <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<LogIn />} />
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/new-sleep-entry" element={isAuthenticated ? <SleepEntryForm /> : <Navigate to="/login" />} />
                <Route path="/logout" element={<Logout />} />
              </Routes>
            </Container>
            <footer className="app-footer">
              <Typography variant="body1">Sweet Dreams! &copy; 2024 Somniferous Inc.</Typography>
            </footer>
          </Router>
        </SleepProvider>
      </ErrorBoundary>
    );
  }
}

export default App;
