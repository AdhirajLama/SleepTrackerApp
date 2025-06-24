import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SleepList = () => {
  const [sleeps, setSleeps] = useState([]);

  useEffect(() => {
    const fetchSleeps = async () => {
      try {
        const response = await axios.get('http://localhost:5000/sleeps');
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