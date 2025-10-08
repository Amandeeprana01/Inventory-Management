import React, { useState } from 'react';
import axios from 'axios';

// Configure Axios to send cookies with every request
axios.defaults.withCredentials = true;
const API_BASE_URL = "http://54.227.32.199:30997";

const LoginView = ({ setIsLoggedIn, setUsername, setIsAdmin, setAuthMessage, setShowLogin, fetchInventory, fetchSummary, fetchUserInventory }) => {
  const [loginFormUsername, setLoginFormUsername] = useState('');
  const [loginFormPassword, setLoginFormPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username: loginFormUsername,
        password: loginFormPassword
      });
      setIsLoggedIn(true);
      setUsername(response.data.username);
      setIsAdmin(response.data.is_admin);
      setAuthMessage('');
      if (response.data.is_admin) {
        fetchInventory();
        fetchSummary();
      } else {
        fetchUserInventory();
      }
    } catch (error) {
      setAuthMessage(error.response?.data?.error || "Login failed.");
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-100 mb-4 text-center">Login</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Username"
          value={loginFormUsername}
          onChange={(e) => setLoginFormUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          value={loginFormPassword}
          onChange={(e) => setLoginFormPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold transition-colors duration-200 hover:bg-blue-700">Login</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Don't have an account? <button type="button" onClick={() => setShowLogin(false)} className="text-blue-400 font-medium hover:underline focus:outline-none">Register here.</button>
      </p>
    </div>
  );
};

export default LoginView;
