import React from 'react';

const UserInventoryView = ({ inventory, loading }) => {
  return (
    <>
      <h2 className="text-2xl font-semibold mb-6 text-gray-100">My Assigned Items</h2>
      {loading ? (
        <div className="text-center text-gray-400">Loading your items...</div>
      ) : (
        <div className="space-y-4">
          {inventory.length > 0 ? (
            inventory.map(item => (
              <div key={item.id} className="bg-gray-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
                <div>
                  <h5 className="text-lg font-medium text-gray-100">{item.name}</h5>
                  <small className="text-gray-400">Quantity: {item.quantity}</small>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 p-4 bg-gray-800 rounded-xl">
              No items assigned to you yet.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default UserInventoryView;
