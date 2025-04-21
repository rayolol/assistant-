import React, { useState, useEffect } from 'react';
import { useUserStore } from '../types/UserStore.tsx';
import { fetchConversations } from '../api/api.tsx';
import { Conversation } from '../types/message.tsx';

interface SidebarProps {
  onNewConversation: () => void;
  onClose: () => void;
}

const ConversationSidebar: React.FC<SidebarProps> = ({ onNewConversation, onClose }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, conversation_id, setConversationId } = useUserStore();
  
  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);
  
  // Load conversations from API
  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetchConversations(user);
      if (response && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    onClose(); // Close sidebar on mobile after selection
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <button 
          onClick={onClose}
          className="md:hidden p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Close sidebar"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* New conversation button */}
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Conversation
        </button>
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-4 text-gray-500 dark:text-gray-400">
            No conversations yet
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors ${
                    conversation_id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate">
                      {conv.name || 'New Conversation'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(conv.last_active)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                    {formatDate(conv.started_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
