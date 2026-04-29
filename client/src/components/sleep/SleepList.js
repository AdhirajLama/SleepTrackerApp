import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';
import { getAuthHeaders } from '../../utils/authHeaders';

/** Simple list view of the current user's sleep records (uses authenticated API). */
const SleepList = () => {
  const [sleeps, setSleeps] = useState([]);

  useEffect(() => {
    const fetchSleeps = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sleeps/sleepdata`, {
          headers: getAuthHeaders(),
        });
        setSleeps(response.data);
      } catch (error) {
        console.error('Error fetching sleep data:', error);
      }
    };

    fetchSleeps();
  }, []);

  return (
    <div>
      <h1>Sleep Records</h1>
      <ul>
        {sleeps.map((sleep) => (
          <li key={sleep._id}>{`${sleep.date}: ${sleep.hours} hours, Quality: ${sleep.quality}`}</li>
        ))}
      </ul>
    </div>
  );
};

export default SleepList;
