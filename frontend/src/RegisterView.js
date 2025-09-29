import React, { useState } from 'react';
import axios from 'axios';

// Configure Axios to send cookies with every request
axios.defaults.withCredentials = true;

const RegisterView = ({ setAuthMessage, setShowLogin }) => {
  const [registerFormUsername, setRegisterFormUsername] = useState('');
  const [registerFormPassword, setRegisterFormPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        username: registerFormUsername,
        password: registerFormPassword
      });
      setAuthMessage(response.data.message);
      setRegisterFormUsername('');
      setRegisterFormPassword('');
      setShowLogin(true);
    } catch (error) {
      setAuthMessage(error.response?.data?.error || "Registration failed.");
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-100 mb-4 text-center">Register</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Username"
          value={registerFormUsername}
          onChange={(e) => setRegisterFormUsername(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          value={registerFormPassword}
          onChange={(e) => setRegisterFormPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full px-4 py-2 rounded-xl bg-green-600 text-white font-semibold transition-colors duration-200 hover:bg-green-700">Register</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-400">
        Already have an account? <button type="button" onClick={() => setShowLogin(true)} className="text-blue-400 font-medium hover:underline focus:outline-none">Login here.</button>
      </p>
    </div>
  );
};

export default RegisterView;
