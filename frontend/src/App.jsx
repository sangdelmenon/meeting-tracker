import { useState, useEffect, useRef } from 'react';
import { sendMessage, clearConversation } from './api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const data = await sendMessage('list pending items');
        
        if (data.allActionItems && data.allActionItems.length > 0) {
          setActionItems(data.allActionItems);
        }
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
          // Check if last message was meeting notes
          const lastMsg = data.history[data.history.length - 1];
          if (lastMsg.role === 'assistant' && lastMsg.content.includes('What would you like me to do?')) {
            setShowQuickActions(true);
          }
        }
      } catch (error) {
        console.log('Starting fresh conversation', error);
      }
    };

    loadConversation();
  }, []);

  const handleSend = async (messageText = null) => {
    const messageToSend = messageText || input;
    if (!messageToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: messageToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput('');
    setLoading(true);
    setShowQuickActions(false);

    try {
      const data = await sendMessage(messageToSend);
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Show quick actions if meeting notes detected
      if (assistantMessage.content.includes('What would you like me to do?')) {
        setShowQuickActions(true);
      }
      
      if (data.allActionItems !== undefined && data.allActionItems !== null) {
        setActionItems(data.allActionItems);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    handleSend(action);
  };

  const handleClear = async () => {
    if (confirm('Clear conversation and all action items?')) {
      try {
        await clearConversation();
        setMessages([]);
        setActionItems([]);
        setShowQuickActions(false);
      } catch (error) {
        console.error('Error clearing conversation:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const pendingItems = actionItems.filter(item => item.status === 'pending');
  const doneItems = actionItems.filter(item => item.status === 'done');

  return (
    <div className="app">
      <header className="header">
        <h1>📋 Meeting Tracker</h1>
        <p>AI-powered meeting notes & action item management</p>
      </header>

      <div className="container">
        {/* Action Items Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Action Items</h2>
            <span className="badge">{pendingItems.length} pending</span>
          </div>

          {actionItems.length === 0 ? (
            <div className="empty-state">
              <p>No action items yet.</p>
              <p className="hint">Paste meeting notes to get started!</p>
            </div>
          ) : (
            <>
              {pendingItems.length > 0 && (
                <div className="action-items-section">
                  <h3>Pending ({pendingItems.length})</h3>
                  {pendingItems.map(item => (
                    <ActionItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}

              {doneItems.length > 0 && (
                <div className="action-items-section">
                  <h3>Completed ({doneItems.length})</h3>
                  {doneItems.map(item => (
                    <ActionItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* Chat Area */}
        <main className="chat-area">
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome">
                <h2>Welcome! 👋</h2>
                <p>Paste your meeting notes to extract action items automatically!</p>
                <div className="example">
                  <strong>Example format:</strong>
                  <p style={{marginTop: '0.5rem'}}>Product Team Meeting - Feb 2, 2026</p>
                  <p style={{marginTop: '0.5rem'}}>Action Items:</p>
                  <ul>
                    <li>Sarah will finalize the requirements by Friday</li>
                    <li>Mike needs to review the API by Wednesday</li>
                    <li>Lisa should create mockups by next Monday</li>
                  </ul>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                </div>
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            {showQuickActions && !loading && (
              <div className="quick-actions">
                <button 
                  onClick={() => handleQuickAction('extract action items')}
                  className="quick-action-btn primary"
                >
                  ✨ Extract Action Items
                </button>
                <button 
                  onClick={() => handleQuickAction('summarize the key points')}
                  className="quick-action-btn"
                >
                  📝 Summarize
                </button>
                <button 
                  onClick={() => handleQuickAction('list attendees')}
                  className="quick-action-btn"
                >
                  👥 List Attendees
                </button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste meeting notes or ask a question..."
              disabled={loading}
              rows={3}
            />
            <div className="input-controls">
              <button onClick={handleClear} className="btn-secondary">
                Clear
              </button>
              <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="btn-primary">
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ActionItemCard({ item }) {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return (
    <div className={`action-item ${item.status}`}>
      <div className="action-item-header">
        <span 
          className="priority-badge" 
          style={{ backgroundColor: priorityColors[item.priority] }}
        >
          {item.priority}
        </span>
        {item.status === 'done' && <span className="done-badge">✓</span>}
      </div>
      <div className="action-item-title">{item.title}</div>
      {item.owner && (
        <div className="action-item-meta">👤 {item.owner}</div>
      )}
      {item.dueDate && (
        <div className="action-item-meta">📅 {item.dueDate}</div>
      )}
    </div>
  );
}

export default App;
