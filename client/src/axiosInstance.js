// src/axiosInstance.js — optional shared client (attach getAuthHeaders() per request as needed)
import axios from 'axios';
import { API_BASE_URL } from './constants/api';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

export default axiosInstance;
