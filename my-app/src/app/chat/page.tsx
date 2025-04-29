"use client";

import ChatWindow from './component/ChatWindow';
import SideBar from './component/SideBar';

const ChatPage = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-800">
      {/* Sidebar - hidden on mobile by default */}
      <div className={` md:block w-1/6 lg:w-1/6 flex-shrink-0 bg-zinc-900 border-r border-gray-200 dark:border-neutral-950`}>
        <SideBar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-500 py-4 px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Memory Chat</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
