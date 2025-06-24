import React, { useState } from 'react';
import axios from 'axios';
import './SleepEntryForm.css'; 

function SleepEntryForm() {
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('');
  const [error, setError] = useState(null); // State to manage errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token'); // Get the token from local storage
      if (!token) {
        throw new Error('No token found');
      }
      const response = await axios.post('http://localhost:5000/api/sleeps', { date, hours, quality }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Sleep data submitted:', response.data);
    } catch (error) {
      console.error('Error submitting sleep data:', error);
      setError('Error submitting sleep data. Please try again.'); // Set error message
    }
  };

  return (
    <div className="sleep-entry-container">
      <h2>New Sleep Entry</h2>
      {error && <div className="error">{error}</div>} {/* Display error message */}
      <form onSubmit={handleSubmit}>
        <label>
          Date:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label>
          Hours Slept:
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            placeholder="Hours slept"
            min="0"
            max="24"
          />
        </label>
        <label>
          Sleep Quality:
          <select value={quality} onChange={(e) => setQuality(e.target.value)} required>
            <option value="">Select Quality</option>
            <option value="Poor">Poor</option>
            <option value="Average">Average</option>
            <option value="Good">Good</option>
            <option value="Excellent">Excellent</option>
          </select>
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default SleepEntryForm;
