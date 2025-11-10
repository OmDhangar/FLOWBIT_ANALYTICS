'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Code2, Database } from 'lucide-react';
import { chatApi } from '@/lib/api';
import type { ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatApi.query(input.trim());
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message || 'Here are the results:',
        sql: response.sql,
        data: response.results || response.data,
        error: response.error,
        timestamp: new Date(),
        executionTime: response.executionTime,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        error: error.message || 'Unknown error occurred',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Chat with Data</h2>
        <p className="text-gray-600 mt-1">Ask questions about your invoices and analytics</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 max-w-md">
              Ask questions about your invoice data, spending trends, vendor analytics, and more.
            </p>
            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-gray-700">Try asking:</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>"What's the total spend in the last 90 days?"</p>
                <p>"Which vendor has the highest invoice count?"</p>
                <p>"Show me spending by category this month"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-4',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div
              className={cn(
                'max-w-3xl rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {message.sql && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Code2 className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                        SQL Query
                      </span>
                    </div>
                    <pre className="text-green-400 text-sm font-mono overflow-x-auto">
                      {message.sql}
                    </pre>
                  </div>
              )}

              {message.data && message.data.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(message.data[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {message.data.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {Object.values(row).map((val, j) => (
                              <td
                                key={j}
                                className="px-4 py-2 text-sm text-gray-900"
                              >
                                {typeof val === 'number'
                                  ? val.toLocaleString('de-DE', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {message.data.length > 10 && (
                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                        Showing 10 of {message.data.length} results
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{message.error}</p>
                </div>
              )}

              {message.executionTime && (
                <div className="mt-2 text-xs text-gray-500">
                  Executed in {message.executionTime.toFixed(2)}s
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">U</span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '200px',
              }}
              disabled={loading}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}

