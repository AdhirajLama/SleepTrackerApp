// src/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/sleeps', // Update with your backend URL
});

export default axiosInstance;
