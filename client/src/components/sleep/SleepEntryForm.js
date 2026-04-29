import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { getAuthHeaders } from '../../utils/authHeaders';
import { Alert, Box, Button, Divider, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import './SleepEntryForm.css';

function SleepEntryForm() {
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      const hoursNum = parseFloat(hours, 10);
      await axios.post(
        `${API_BASE_URL}/api/sleeps`,
        { date, hours: hoursNum, quality },
        { headers: getAuthHeaders() }
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error submitting sleep data:', err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.message === 'No token found' ? 'Please log in again.' : null) ||
        'Error submitting sleep data. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="sleep-entry-container">
      <Paper className="sleep-entry-card" elevation={3}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Log your sleep
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This takes under a minute, but it powers your dashboard trends and makes the Sleep Advice engine more
              accurate. Treat it like a quick daily check-in.
            </Typography>
          </Box>

          <Box className="sleep-entry-callout" role="note">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Why this matters
            </Typography>
            <ul className="sleep-entry-bullets">
              <li>Helps spot patterns (short nights, inconsistency, low-quality streaks)</li>
              <li>Makes the advice score more confident as you add more logs</li>
              <li>Builds a simple habit that supports better routines</li>
            </ul>
          </Box>

          <Divider />

          {error && (
            <Alert severity="error" className="sleep-entry-error">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="sleep-entry-form">
            <Stack spacing={2}>
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Pick the date you slept (usually last night)."
              />

              <TextField
                label="Hours slept"
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
                inputProps={{ min: 0, max: 24, step: 0.25 }}
                helperText="Example: 7.5"
              />

              <TextField
                select
                label="Sleep quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                required
                helperText="Your personal feel—no need to overthink it."
              >
                <MenuItem value="Poor">Poor</MenuItem>
                <MenuItem value="Average">Average</MenuItem>
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Excellent">Excellent</MenuItem>
              </TextField>

              <Button type="submit" variant="contained" disabled={submitting} size="large">
                {submitting ? 'Saving…' : 'Save sleep log'}
              </Button>

              <Typography variant="caption" color="text.secondary">
                Tip: logging consistently is more useful than logging “perfectly.”
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default SleepEntryForm;
