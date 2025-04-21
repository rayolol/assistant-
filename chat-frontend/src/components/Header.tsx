import React from 'react';
import { useUserStore } from '../types/UserStore.tsx';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useUserStore();
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 flex items-center justify-between">
      {/* Left side - Menu button and logo */}
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-label="Open sidebar"
        >
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="ml-2 md:ml-0 flex items-center">
          <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">Memory Chat</span>
        </div>
      </div>
      
      {/* Right side - User info */}
      <div className="flex items-center">
        {user ? (
          <div className="flex items-center">
            <div className="hidden md:block mr-3">
              <p className="text-sm font-medium">{user}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user.charAt(0).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
