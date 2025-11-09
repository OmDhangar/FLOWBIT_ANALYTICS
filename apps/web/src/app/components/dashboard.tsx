import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, FileText, DollarSign, Upload, MessageSquare, LayoutDashboard, Search } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cashOutflow, setCashOutflow] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, vendorsRes, catRes, cashRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/invoice-trends`),
        fetch(`${API_URL}/vendors/top10`),
        fetch(`${API_URL}/category-spend`),
        fetch(`${API_URL}/cash-outflow`),
        fetch(`${API_URL}/invoices?limit=50`)
      ]);

      setStats(await statsRes.json());
      setTrends(await trendsRes.json());
      setTopVendors(await vendorsRes.json());
      setCategories(await catRes.json());
      setCashOutflow(await cashRes.json());
      setInvoices(await invoicesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    const query = chatInput;
    setChatInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat-with-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        sql: data.sql,
        data: data.data,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className={`flex items-center text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change).toFixed(1)}% from last year
          </div>
        </div>
      </div>
    </div>
  );

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">F</div>
            <span className="text-xl font-bold text-gray-900">Flowbit AI</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">General</div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg mb-1 ${
              activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg ${
              activeTab === 'chat' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chat with Data</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back, Amit Jadhav</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">AJ</span>
                  </div>
                </div>
              </div>

              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard title="Total Spend (YTD)" value={`€ ${stats.totalSpend.toLocaleString()}`} change={stats.totalSpendChange} icon={DollarSign} />
                  <StatCard title="Total Invoices Processed" value={stats.totalInvoices} change={stats.totalInvoicesChange} icon={FileText} />
                  <StatCard title="Documents Uploaded" value={stats.documentsUploaded} change={stats.documentsUploadedChange} icon={Upload} />
                  <StatCard title="Average Invoice Value" value={`€ ${stats.averageInvoiceValue.toLocaleString()}`} change={stats.averageInvoiceValueChange} icon={TrendingUp} />
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Volume + Value Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="invoiceCount" stroke="#3b82f6" name="Invoice Count" strokeWidth={2} />
                      <Line type="monotone" dataKey="totalValue" stroke="#10b981" name="Total Value (€)" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Spend by Vendor (Top 10)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topVendors} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" stroke="#6b7280" />
                      <YAxis dataKey="vendorName" type="category" stroke="#6b7280" width={120} />
                      <Tooltip />
                      <Bar dataKey="totalSpend" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Spend by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categories} cx="50%" cy="50%" labelLine={false} label={({category, percentage}) => `${category}: ${percentage.toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="amount">
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Outflow Forecast</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={cashOutflow}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Invoices by Vendor</h3>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"># Invoice</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvoices.slice(0, 10).map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{invoice.vendorName}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{invoice.invoiceNumber}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">€ {invoice.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{invoice.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-8rem)]">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Chat with Data</h2>
                <p className="text-gray-600 mt-1">Ask questions about your invoices and analytics</p>
              </div>
              
              <div className="flex flex-col h-[calc(100%-10rem)]">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Start a conversation</p>
                      <p className="text-sm mt-2">Try asking: "What's the total spend in the last 90 days?"</p>
                    </div>
                  )}
                  
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3xl rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="mb-2">{msg.content}</p>
                        {msg.sql && (
                          <div className="mt-3 p-3 bg-gray-800 text-green-400 rounded text-sm font-mono overflow-x-auto">
                            {msg.sql}
                          </div>
                        )}
                        {msg.data && msg.data.length > 0 && (
                          <div className="mt-3 overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-200">
                                <tr>
                                  {Object.keys(msg.data[0]).map(key => (
                                    <th key={key} className="px-3 py-2 text-left">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.data.slice(0, 5).map((row, i) => (
                                  <tr key={i} className="border-t">
                                    {Object.values(row).map((val, j) => (
                                      <td key={j} className="px-3 py-2">{String(val)}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-4">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()} placeholder="Ask a question about your data..." className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={loading} />
                    <button onClick={handleChatSubmit} disabled={loading || !chatInput.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;