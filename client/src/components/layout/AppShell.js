import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button, CssBaseline } from '@mui/material';
import logo from '../../208778712.png';

/**
 * Shell: hero logo, nav bar, main content, footer. Class names match App.css (styling unchanged).
 */
function AppShell({ children }) {
  const { pathname } = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <>
      <CssBaseline />
      <div className="app-logo-container">
        <img src={logo} alt="logo" className="app-logo-large" />
        <Typography variant="h4" className="welcome-text">
          Welcome to Your Sleep Tracker!
        </Typography>
      </div>
      <AppBar position="static" className="app-bar">
        <Toolbar aria-label={`Main navigation (${pathname})`}>
          <Typography variant="h6" className="app-title">
            Sleep Tracker
          </Typography>
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/signup">
                Sign Up
              </Button>
              <Button color="inherit" component={Link} to="/login">
                Log In
              </Button>
            </>
          )}
          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/new-sleep-entry">
                Sleep Data
              </Button>
              <Button color="inherit" component={Link} to="/sleep-advice">
                Sleep Advice
              </Button>
              <Button color="inherit" component={Link} to="/logout">
                Log Out
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container className="content">{children}</Container>
      <footer className="app-footer">
        <Typography variant="body1">Sweet Dreams! &copy; 2024 Somniferous Inc.</Typography>
      </footer>
    </>
  );
}

export default AppShell;
