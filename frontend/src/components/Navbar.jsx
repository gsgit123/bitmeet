import React from 'react';
import { useAuthStore } from '../store/useAuthStore';

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <div className="text-lg font-bold">My App</div>

      <div>
        {authUser ? (
          <>
            <span className="mr-4">Hello, {authUser.username}</span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <span>Please log in</span>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
