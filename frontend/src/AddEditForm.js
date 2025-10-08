import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure Axios to send cookies with every request
axios.defaults.withCredentials = true;

const AddEditForm = ({ editingItem, setEditingItem, setCurrentPage, fetchInventory, fetchSummary }) => {
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  // Use useEffect to load the data when editing an item
  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.name);
      setItemQuantity(editingItem.quantity);
      setItemPrice(editingItem.price);
    } else {
      // Clear the form when not editing
      setItemName('');
      setItemQuantity('');
      setItemPrice('');
    }
  }, [editingItem]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: itemName,
        quantity: parseInt(itemQuantity),
        price: parseFloat(itemPrice)
      };

      if (editingItem) {
        // Handle update
        await axios.put(`http://54.227.32.199:30997/api/inventory/${editingItem.id}`, itemData);
      } else {
        // Handle add
        await axios.post('http://54.227.32.199:30997/api/inventory', itemData);
      }

      // Clear the form and fetch new data
      setEditingItem(null);
      fetchInventory();
      fetchSummary();
      setCurrentPage('inventory');
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          required
        />
        <input
          type="number"
          className="w-full px-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Quantity"
          value={itemQuantity}
          onChange={(e) => setItemQuantity(e.target.value)}
          required
        />
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 rounded-xl bg-gray-700 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Price"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-2">
          <button type="submit" className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold transition-colors duration-200 hover:bg-blue-700">
            {editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button
              type="button"
              className="w-full px-4 py-2 rounded-xl bg-gray-600 text-gray-200 font-semibold transition-colors duration-200 hover:bg-gray-700"
              onClick={() => {
                setEditingItem(null);
                setCurrentPage('inventory');
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </>
  );
};

export default AddEditForm;
