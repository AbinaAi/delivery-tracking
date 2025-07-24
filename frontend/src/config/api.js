import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001/api';

// API service class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from secure storage
  async getAuthToken() {
    try {
      return await SecureStore.getItemAsync('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set auth token in secure storage
  async setAuthToken(token) {
    try {
      await SecureStore.setItemAsync('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Remove auth token from secure storage
  async removeAuthToken() {
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Make authenticated API request
  async request(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password, role = 'customer') {
    const response = await fetch(`${this.baseURL}/auth/${role}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    await this.setAuthToken(data.token);
    return data;
  }

  async register(userData) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    await this.setAuthToken(data.token);
    return data;
  }

  async logout() {
    await this.removeAuthToken();
  }

  // Order methods
  async createOrder(orderData) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getCustomerOrders() {
    return await this.request('/orders/customer');
  }

  async getDriverOrders() {
    return await this.request('/orders/driver');
  }

  async getOrderDetails(orderId) {
    return await this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId, statusData) {
    return await this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  }

  // Location methods
  async updateLocation(locationData) {
    return await this.request('/location/update', {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
  }

  async getDriverLocation(driverId) {
    return await this.request(`/location/driver/${driverId}`);
  }

  async getDriverLocationHistory(driverId, hours = 24) {
    return await this.request(`/location/driver/${driverId}/history?hours=${hours}`);
  }

  async getActiveDriverLocations() {
    return await this.request('/location/active-drivers');
  }
}

export const apiService = new ApiService();
export default apiService; 