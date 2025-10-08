import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {CheckCircle, XCircle } from 'lucide-react';

// Configure Axios to send cookies with every request
axios.defaults.withCredentials = true;
// NOTE: Define API_BASE_URL here for consistency
const API_BASE_URL = 'http://54.227.32.199:30997';

const AssignView = ({ item, setCurrentPage, fetchInventory, fetchSummary, setAssigningItem }) => {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [assignQuantity, setAssignQuantity] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Guard against null item prop
    if (!item) {
        return (
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl text-center">
                <h2 className="text-2xl font-bold mb-4 text-white">No Item Selected</h2>
                <p className="text-gray-400 mb-6">Please go back to the inventory list and select an item to assign.</p>
                <button
                    onClick={() => setCurrentPage('inventory')}
                    className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition duration-300"
                >
                    Go to Inventory
                </button>
            </div>
        );
    }

    const fetchUsers = async () => {
        try {
            // FIX 1: Use the correct API prefix in the URL
            const response = await axios.get(`${API_BASE_URL}/api/users`); 
            setUsers(response.data.users);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to fetch users');
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Ensure user ID and quantity are valid integers
        const userId = parseInt(selectedUserId, 10);
        const quantityToAssign = parseInt(assignQuantity, 10);

        if (!userId || quantityToAssign <= 0 || isNaN(userId) || isNaN(quantityToAssign)) {
            setMessage('Please select a user and enter a valid quantity.');
            setLoading(false);
            return;
        }

        try {
            // FIX 2: Use the existing POST route on the backend which handles both
            // creating new allocations AND updating existing ones.
            await axios.post(`${API_BASE_URL}/api/allocations`, {
                user_id: userId,
                inventory_id: item.id,
                quantity: quantityToAssign,
            });

            setMessage('Item assigned successfully! 🎉');
            
            // Clear form and refresh data
            setSelectedUserId('');
            setAssignQuantity('');
            fetchInventory(); // Update the quantity in the Admin inventory list
            // fetchSummary(); // Re-fetch summary if you want to update overall stats
            
            // Give the user a moment to see the success message, then navigate back
            setTimeout(() => {
                setCurrentPage('inventory');
                setAssigningItem(null);
            }, 1000);

        } catch (error) {
            // Display error from backend (e.g., "Not enough stock available")
            setMessage(error.response?.data?.error || 'Failed to assign item. Check stock and user.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Assign "{item.name}"</h2>
            <div className="text-gray-400 mb-4 text-sm">
                **Current Stock:** <span className="text-blue-400 font-semibold">{item.quantity}</span>
            </div>
            {message && (
                <div className={`p-3 rounded-xl mb-4 text-sm font-medium flex items-center ${message.includes('success') ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
                    {message.includes('success') ? <CheckCircle size={16} className="mr-2" /> : <XCircle size={16} className="mr-2" />}
                    {message}
                </div>
            )}
            <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Select User</label>
                    <select
                        className="w-full px-4 py-2 mt-1 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        required
                    >
                        <option value="">-- Select a user --</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.username}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Quantity to Assign (Max: {item.quantity})</label>
                    <input
                        type="number"
                        className="w-full px-4 py-2 mt-1 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={assignQuantity}
                        onChange={(e) => setAssignQuantity(e.target.value)}
                        min="1"
                        max={item.quantity}
                        required
                    />
                </div>
                <div className="flex space-x-2">
                    <button
                        type="submit"
                        disabled={loading || !selectedUserId || !assignQuantity || parseInt(assignQuantity, 10) > item.quantity}
                        className="flex-1 px-4 py-2 rounded-xl bg-green-600 text-white font-semibold shadow-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Assigning...' : 'Assign'}
                    </button>
                    <button
                        type="button"
                        className="flex-1 px-4 py-2 rounded-xl bg-gray-600 text-gray-200 font-semibold shadow-lg hover:bg-gray-700 transition duration-300"
                        onClick={() => setCurrentPage('inventory')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AssignView;