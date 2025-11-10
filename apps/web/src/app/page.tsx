'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import Dashboard from '@/components/dashboard/Dashboard';
import ChatInterface from '@/components/chat/ChatInterface';
import Sidebar from '@/components/dashboard/Sidebar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className={cn("flex-1 overflow-hidden transition-all duration-300", isSidebarCollapsed ? "lg:ml-4 ml-4" : "lg:ml-4 ml-4")}>
        {activeTab === 'dashboard' ? (
          <div className="h-full overflow-auto">
            <Dashboard />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-6xl h-full">
              <ChatInterface />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
