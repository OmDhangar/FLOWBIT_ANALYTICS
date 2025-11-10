'use client';

import { useState } from 'react';
import { LayoutDashboard, FileText, Folder, Building2, Users, Settings, GraduationCap, MessageSquare, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: 'dashboard' | 'chat';
  onTabChange: (tab: 'dashboard' | 'chat') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Mobile/Desktop Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        "fixed lg:relative z-40"
      )}>
      {/* Header */}
      <div className={cn("border-b border-gray-200", isCollapsed ? "p-3" : "p-6")}>
        <div className="flex items-center justify-between mb-2">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-black font-bold text-lg">L</span>
            </div>
            
              <>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Buchhaltung</div>
                  <div className="text-xs text-gray-500">12 members</div>
                </div>
              </>
            
          </div>
        )}
          
              <button
                onClick={onToggleCollapse}
                className="p-1 pl-3 hover:bg-gray-100 rounded lg:block hidden"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {/* Change the icon based on the state */}
                {isCollapsed ? (
                  <Menu className="w-5 h-5 text-gray-500" />
                ) : (
                  <X className="w-5 h-5 text-gray-500" />
                )}
              </button>
        </div>
        {!isCollapsed && <div className="h-px bg-green-500 w-full mt-4"></div>}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}>
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2 tracking-wider">
            GENERAL
          </div>
        )}
        <div className="space-y-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={cn(
              "w-full flex items-center rounded-lg transition-colors",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5",
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            )}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Dashboard</span>}
          </button>

          <button
            onClick={() => onTabChange('chat')}
            className={cn(
              "w-full flex items-center rounded-lg transition-colors",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5",
              activeTab === 'chat'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            )}
            title={isCollapsed ? "Chat with Data" : undefined}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Chat with Data</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5"
            )}
            title={isCollapsed ? "Invoice" : undefined}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Invoice</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5"
            )}
            title={isCollapsed ? "Other files" : undefined}
          >
            <Folder className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Other files</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5"
            )}
            title={isCollapsed ? "Departments" : undefined}
          >
            <Building2 className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Departments</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5"
            )}
            title={isCollapsed ? "Users" : undefined}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Users</span>}
          </button>

          <button
            className={cn(
              "w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-50",
              isCollapsed ? "justify-center px-2 py-2.5" : "space-x-3 px-3 py-2.5"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Settings</span>}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className={cn("border-t border-gray-200", isCollapsed ? "p-2" : "p-4")}>
        {!isCollapsed && <div className="h-px bg-green-500 w-full mb-4"></div>}
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "space-x-2")}>
          <GraduationCap className="w-5 h-5 text-purple-600 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium text-gray-900">Flowbit AI</span>}
        </div>
      </div>
    </div>
    </>
  );
}
