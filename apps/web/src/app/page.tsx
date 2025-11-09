'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, MessageSquare } from 'lucide-react';
import Dashboard from '@/components/dashboard/Dashboard';
import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Flowbit</h1>
            <p className="text-sm text-gray-500">Analytics Platform</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium">Chat with Data</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <header className="bg-white border-b border-gray-200 px-8 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab === 'dashboard' ? 'Analytics Dashboard' : 'Chat with Data'}
            </h2>
          </header>

          <div className="p-8">
            {activeTab === 'dashboard' ? <Dashboard /> : <ChatInterface />}
          </div>
        </div>
      </div>
    </main>
  );
}
