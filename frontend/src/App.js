import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Home, List, Plus, Search, Edit, Trash2, User, UserCheck } from 'lucide-react';
import AddEditForm from './AddEditForm';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import UserInventoryView from './UserInventoryView';
import AssignView from './AssignView';

Chart.register(...registerables);
axios.defaults.withCredentials = true;

const App = () => {
  // Authentication & User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [is_admin, setIsAdmin] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [showLogin, setShowLogin] = useState(true);

  // Inventory & UI State
  const [inventory, setInventory] = useState([]);
  const [userInventory, setUserInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [assigningItem, setAssigningItem] = useState(null); // New state for item being assigned
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [totalItems, setTotalItems] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Chart References
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // API Call Handlers
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/inventory');
      setInventory(response.data.inventory);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      setLoading(false);
    }
  };

  // New function to fetch inventory for a normal user
  const fetchUserInventory = async () => {
    try {
      setLoading(true);
      // This endpoint needs to be created on the backend to return only items assigned to the current user
      const response = await axios.get('http://localhost:5000/api/my-inventory');
      setUserInventory(response.data.inventory);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user inventory data:", error);
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory/summary');
      setTotalItems(response.data.total_items);
      setTotalValue(response.data.total_value);
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${itemId}`);
      fetchInventory();
      fetchSummary();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setCurrentPage('add');
  };

  // New handler for assigning items
  const handleAssignItem = (item) => {
    setAssigningItem(item);
    setCurrentPage('assign');
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/logout');
      setIsLoggedIn(false);
      setUsername('');
      setIsAdmin(false);
      setAuthMessage('');
      setInventory([]);
      setUserInventory([]);
      setCurrentPage('dashboard');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Effects and Computations
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/status');
        if (response.data.is_logged_in) {
          setIsLoggedIn(true);
          setUsername(response.data.username);
          setIsAdmin(response.data.is_admin);
          if (response.data.is_admin) {
            fetchInventory();
            fetchSummary();
          } else {
            fetchUserInventory();
          }
        }
      } catch (error) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        console.error("Status check failed:", error);
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (chartRef.current && inventory.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      const labels = inventory.map(item => item.name);
      const data = inventory.map(item => item.quantity);
      const newChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Quantity in Stock',
            data: data,
            backgroundColor: 'rgba(13, 110, 253, 0.6)',
            borderColor: '#0d6efd',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#f8f9fa' } },
            x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#f8f9fa' } }
          },
          plugins: { legend: { labels: { color: '#f8f9fa' } } }
        }
      });
      chartInstanceRef.current = newChartInstance;
    }
  }, [inventory]);

  const filteredAndSortedInventory = inventory
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return a.quantity - b.quantity;
      if (sortBy === 'price') return a.price - b.price;
      return 0;
    });

  const DashboardView = () => (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">Dashboard</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
          <h5 className="text-xl font-medium mb-2 text-gray-300">Total Unique Items</h5>
          <p className="text-4xl font-bold text-blue-400">{totalItems}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg transform transition duration-300 hover:scale-105">
          <h5 className="text-xl font-medium mb-2 text-gray-300">Total Inventory Value</h5>
          <p className="text-4xl font-bold text-blue-400">${totalValue.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mt-8">
        <h5 className="text-xl font-medium text-center text-gray-100 mb-4">Inventory Quantity Breakdown</h5>
        <div className="relative h-96">
          {inventory.length > 0 ? (
            <canvas ref={chartRef}></canvas>
          ) : (
            <div className="text-center text-gray-400 p-4">Add items to see the chart!</div>
          )}
        </div>
      </div>
    </>
  );

  const InventoryView = () => (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">Current Inventory</h2>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <select
          className="bg-gray-700 text-gray-100 py-2 px-4 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="name">Sort by Name</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="price">Sort by Price</option>
        </select>
      </div>
      {loading ? (
        <div className="text-center text-gray-400">Loading inventory...</div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedInventory.length > 0 ? (
            filteredAndSortedInventory.map(item => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
                <div>
                  <h5 className="text-lg font-medium text-gray-100">{item.name}</h5>
                  <small className="text-gray-400">Quantity: {item.quantity} | Price: ${item.price}</small>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition" onClick={() => handleEditItem(item)}>
                    <Edit size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-yellow-500 text-white hover:bg-yellow-600 transition" onClick={() => handleAssignItem(item)}>
                    <UserCheck size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition" onClick={() => handleDeleteItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 p-4 bg-gray-800 rounded-xl">
              No inventory items found. Add one from the navigation.
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderContent = () => {
    if (!is_admin) {
      // Normal user view
      switch (currentPage) {
        case 'my-inventory':
          return <UserInventoryView inventory={userInventory} loading={loading} />;
        case 'dashboard':
        default:
          return <DashboardView />;
      }
    } else {
      // Admin user view
      switch (currentPage) {
        case 'dashboard':
          return <DashboardView />;
        case 'inventory':
          return <InventoryView />;
        case 'add':
          return (
            <AddEditForm
              key={editingItem ? editingItem.id : 'add-new'}
              editingItem={editingItem}
              setEditingItem={setEditingItem}
              setCurrentPage={setCurrentPage}
              fetchInventory={fetchInventory}
              fetchSummary={fetchSummary}
            />
          );
        case 'assign':
          return (
            <AssignView
              item={assigningItem}
              setCurrentPage={setCurrentPage}
              fetchInventory={fetchInventory}
              fetchSummary={fetchSummary}
              setAssigningItem={setAssigningItem}
            />
          );
        default:
          return <DashboardView />;
      }
    }
  };

  const renderApp = () => {
    if (isLoggedIn) {
      return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-8">
          <header className="w-full max-w-4xl flex justify-between items-center mb-6 py-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-400">Inventory</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm md:text-base">Hello, <span className="font-semibold">{username}</span></span>
              <button className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg text-sm transition-colors duration-200 hover:bg-gray-600" onClick={handleLogout}>Logout</button>
            </div>
          </header>
          <nav className="w-full max-w-4xl flex justify-around items-center bg-gray-800 rounded-xl p-2 mb-8 shadow-lg">
            <button className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} onClick={() => setCurrentPage('dashboard')}>
              <Home size={20} />
              <span className="mt-1 text-xs font-medium">Dashboard</span>
            </button>
            {is_admin ? (
              <>
                <button className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === 'inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} onClick={() => setCurrentPage('inventory')}>
                  <List size={20} />
                  <span className="mt-1 text-xs font-medium">Inventory</span>
                </button>
                <button className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === 'add' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} onClick={() => { setCurrentPage('add'); setEditingItem(null); setAssigningItem(null); }}>
                  <Plus size={20} />
                  <span className="mt-1 text-xs font-medium">Add Item</span>
                </button>
              </>
            ) : (
              <button className={`flex-1 flex flex-col items-center p-3 rounded-lg transition-colors duration-200 ${currentPage === 'my-inventory' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700'}`} onClick={() => setCurrentPage('my-inventory')}>
                <User size={20} />
                <span className="mt-1 text-xs font-medium">My Inventory</span>
              </button>
            )}
          </nav>
          <main className="w-full max-w-4xl bg-gray-900 p-4 sm:p-6 rounded-xl">
            {renderContent()}
          </main>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">Inventory Manager</h1>
            {authMessage && (
              <div className="bg-blue-900 text-blue-200 text-center text-sm py-2 px-4 rounded-xl mb-4">
                {authMessage}
              </div>
            )}
            {showLogin ? (
              <LoginView
                setIsLoggedIn={setIsLoggedIn}
                setUsername={setUsername}
                setIsAdmin={setIsAdmin}
                setAuthMessage={setAuthMessage}
                setShowLogin={setShowLogin}
                fetchInventory={fetchInventory}
                fetchSummary={fetchSummary}
                fetchUserInventory={fetchUserInventory}
              />
            ) : (
              <RegisterView
                setAuthMessage={setAuthMessage}
                setShowLogin={setShowLogin}
              />
            )}
          </div>
        </div>
      );
    }
  };

  return renderApp();
};

export default App;
