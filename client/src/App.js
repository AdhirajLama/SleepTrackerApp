import React, { Component } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { SleepProvider } from './context/SleepContext';
import ErrorBoundary from './ErrorBoundary';
import AppShell from './components/layout/AppShell';
import AppRoutes from './routes/AppRoutes';
import './App.css';

class App extends Component {
  render() {
    return (
      <ErrorBoundary>
        <SleepProvider>
          <Router>
            <AppShell>
              <AppRoutes />
            </AppShell>
          </Router>
        </SleepProvider>
      </ErrorBoundary>
    );
  }
}

export default App;
