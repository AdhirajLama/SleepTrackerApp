// Import necessary libraries and components
import React, { Component } from 'react'; // Import React and Component class from React
import axios from 'axios'; // Import axios for making HTTP requests
import { Button } from '@mui/material'; // Import Button component from Material-UI
import SleepChart from './SleepChart'; // Import SleepChart component
import './Dashboard.css'; // Import CSS for Dashboard component

// Define Dashboard component as a class
class Dashboard extends Component {
  // Constructor method to initialize state and bind methods
  constructor(props) {
    super(props);
    // Initialize component state
    this.state = {
      sleeps: [], // Array to store sleep data
      editingId: null, // ID of the sleep record being edited
      formData: { date: '', hours: '', quality: '' }, // Form data for editing sleep records
      error: null, // Error message
    };
  }

  // Lifecycle method to fetch sleep data when the component mounts
  componentDidMount() {
    this.fetchData();
  }

  // Method to fetch sleep data from the server
  fetchData = async () => {
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      if (!token) {
        throw new Error('No token found'); // Throw an error if no token is found
      }
      // Make a GET request to fetch sleep data
      const response = await axios.get('http://localhost:5000/api/sleeps/sleepdata', {
        headers: { Authorization: `Bearer ${token}` }, // Set the Authorization header with the token
      });
      this.setState({ sleeps: response.data }); // Update state with fetched sleep data
    } catch (error) {
      console.error('Error! You have not logged in:', error); // Log error message
      this.setState({ error: 'Error! You have not logged in' }); // Update state with error message
    }
  };

  // Method to handle deletion of a sleep record
  handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      // Make a DELETE request to delete the sleep record
      await axios.delete(`http://localhost:5000/api/sleeps/${id}`, {
        headers: { Authorization: `Bearer ${token}` }, // Set the Authorization header with the token
      });
      // Update state by filtering out the deleted sleep record
      this.setState((prevState) => ({
        sleeps: prevState.sleeps.filter(data => data._id !== id),
      }));
    } catch (error) {
      console.error('Error deleting sleep data:', error); // Log error message
      this.setState({ error: 'Error deleting sleep data' }); // Update state with error message
    }
  };

  // Method to handle editing of a sleep record
  handleEdit = (data) => {
    // Update state with the ID of the sleep record being edited and the form data
    this.setState({
      editingId: data._id,
      formData: { date: data.date, hours: data.hours, quality: data.quality },
    });
  };

  // Method to handle form submission for editing sleep records
  handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    const { editingId, formData } = this.state; // Destructure state variables
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      // Make a PUT request to update the sleep record
      await axios.put(`http://localhost:5000/api/sleeps/${editingId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }, // Set the Authorization header with the token
      });
      // Update state with the updated sleep data and reset editing state
      this.setState((prevState) => ({
        sleeps: prevState.sleeps.map(data => (data._id === editingId ? { ...data, ...formData } : data)),
        editingId: null,
        formData: { date: '', hours: '', quality: '' },
      }));
    } catch (error) {
      console.error('Error updating sleep data:', error); // Log error message
      this.setState({ error: 'Error updating sleep data' }); // Update state with error message
    }
  };

  // Method to handle changes in the form inputs
  handleChange = (event) => {
    const { name, value } = event.target; // Get the name and value of the input field
    // Update state with the new form data
    this.setState((prevState) => ({
      formData: { ...prevState.formData, [name]: value },
    }));
  };

  // Render method to display the component
  render() {
    const { sleeps, editingId, formData, error } = this.state; // Destructure state variables

    return (
      <div className="dashboard-container">
        <h2>Sleep Data Dashboard</h2>
        {error && <div className="error">{error}</div>} {/* Display error message */}
        
        {sleeps.length === 0 ? (
          // Display message if no sleep data is available
          <div className="no-data-message">
            <p>You haven't logged any sleep data yet. Start by adding your first sleep log!</p>
          </div>
        ) : (
          <>
            <SleepChart data={sleeps} /> {/* Render SleepChart component with sleep data */}
            <table className="sleep-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hours Slept</th>
                  <th>Quality</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Iterate over sleep data and render rows */}
                {sleeps.map((data) => (
                  <tr key={data._id}>
                    <td>{data.date}</td>
                    <td>{data.hours}</td>
                    <td>{data.quality}</td>
                    <td>
                      <Button onClick={() => this.handleEdit(data)}>Edit</Button> {/* Edit button */}
                      <Button onClick={() => this.handleDelete(data._id)}>Delete</Button> {/* Delete button */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {editingId && (
          // Render form for editing sleep data if editingId is set
          <form onSubmit={this.handleSubmit} className="edit-form">
            <input type="date" name="date" value={formData.date} onChange={this.handleChange} required />
            <input type="number" name="hours" value={formData.hours} onChange={this.handleChange} min="0" max="24" required />
            <select name="quality" value={formData.quality} onChange={this.handleChange} required>
              <option value="">Select Quality</option>
              <option value="Poor">Poor</option>
              <option value="Average">Average</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
            <Button type="submit" variant="contained" color="primary">Update</Button> {/* Submit button */}
          </form>
        )}
      </div>
    );
  }
}

export default Dashboard; // Export Dashboard component as default export
