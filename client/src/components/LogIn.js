// Import necessary libraries and components
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LogIn.css';

function LogIn() {
  // State variables to manage email, password, and error messages
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  // Hook to navigate programmatically
  const navigate = useNavigate();

  // Function to handle the login process
  const handleLogIn = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    console.log('Login form submitted'); // Debugging log
    
    try {
      // Make a POST request to the login API endpoint with email and password
      const response = await axios.post('http://localhost:5000/api/login', { email, password });
      console.log('Login response:', response.data); // Debugging log
      
      // Store the received token in local storage
      localStorage.setItem('token', response.data.token);
      
      // Navigate to the dashboard route upon successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Error logging in:', error); // Log the error for debugging
      setError('Invalid credentials. Please try again.'); // Set the error message for invalid login
    }
  };

  return (
    <div className="login-container">
      <h2>Log In</h2>
      {/* Display error message if there is an error */}
      {error && <div className="error">{error}</div>}
      
      {/* Login form */}
      <form onSubmit={handleLogIn}>
        <label>
          Email:
          <input
            type="email"
            placeholder="Email"
            value={email} // Bind input value to state variable
            onChange={(e) => setEmail(e.target.value)} // Update state variable on input change
            required // Make the input field required
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            placeholder="Password"
            value={password} // Bind input value to state variable
            onChange={(e) => setPassword(e.target.value)} // Update state variable on input change
            required // Make the input field required
          />
        </label>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

export default LogIn;
