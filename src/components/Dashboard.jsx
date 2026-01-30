import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { isAuthenticated } from '../utils/auth';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [title, setTitle] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, conversationId: null });
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  // Define selectConversation first since it's used by fetchConversations
  const selectConversation = useCallback(async (conv) => {
    if (!conv || !conv.id) {
      console.error('Invalid conversation object:', conv);
      return;
    }
    
    try {
      setSelectedConversation(conv);
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/conversation/${conv.id}/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
      });
      setMessages(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  }, [navigate]);

  // Then define fetchConversations
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/listconversation/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      const conversations = Array.isArray(response.data) ? response.data : [];
      console.log('Fetched conversations:', conversations);
      setConversations(conversations);
      
      // Only auto-select first conversation if none is selected
      const shouldSelectFirst = conversations.length > 0 && !selectedConversation;
      if (shouldSelectFirst) {
        await selectConversation(conversations[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [navigate, selectedConversation, selectConversation]);

  // Then define fetchModels
  const fetchModels = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/listmodels/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      const modelList = Object.keys(response.data || {});
      setModels(modelList);
      
      if (modelList.length > 0 && !modelList.includes(model)) {
        setModel(modelList[0]);
      }
    } catch (err) {
      console.error('Error fetching models:', err);
      setModels(['gpt-3.5-turbo']);
    }
  }, [navigate, model]);

  // Then define the effect that uses them
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const initDashboard = async () => {
      try {
        await Promise.all([
          fetchConversations(),
          fetchModels()
        ]);
      } catch (err) {
        console.error('Error initializing dashboard:', err);
      }
    };
    
    initDashboard();
  }, [navigate, fetchConversations, fetchModels]);

  const createConversation = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/newconversation/`, {
        title: '',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Automatically select the newly created conversation
      await selectConversation(response.data);
      
      // Refresh the conversations list to update the sidebar
      await fetchConversations();
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  }, [selectConversation, fetchConversations]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  }, [navigate]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/deleteconversation/${conversationId}/`, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      // Refresh conversations
      await fetchConversations();
      
      // Clear selected conversation if it was the one deleted
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      
      // Close confirmation modal
      setDeleteConfirmation({ show: false, conversationId: null });
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [navigate, selectedConversation, fetchConversations]);

  // 1. First, let's check the sendMessage function
  const sendMessage = useCallback(async () => {
  if (!selectedConversation || !prompt.trim()) return;
  
  const messageToSend = prompt;
  const tempMessageId = Date.now();
  
  // Add message to UI immediately
  setMessages(prev => [...prev, {
    id: tempMessageId,
    user: { username: 'You' },
    message: messageToSend,
    isSending: true
  }]);
  
  setPrompt('');

  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Send the message to the backend
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/conversation/aichat/`,
      {
        prompt: messageToSend,
        model_name: model,
        conversation_id: selectedConversation.id
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // The backend will handle saving both user and AI messages
    // Refresh both messages and conversations list to update title
    console.log('Message sent, refreshing conversation and list...');
    await selectConversation(selectedConversation);
    console.log('Conversation refreshed, fetching conversations list...');
    await fetchConversations();
    console.log('Conversations list refreshed');
    
  } catch (err) {
    console.error('Error sending message:', err);
    // Update message to show error state
    setMessages(prev => prev.map(msg => 
      msg.id === tempMessageId 
        ? { ...msg, error: true, isSending: false } 
        : msg
    ));
  }
}, [selectedConversation, prompt, model, navigate, selectConversation, fetchConversations]);

  // 2. Then, let's check the input and button JSX
  // Make sure your input and button have proper event handlers:
  return (
    <div className="dashboard" style={{ display: 'flex', height: '100vh' }}>
      <div className="sidebar" style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '1rem', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0 }}>Conversations</h2>
        <button 
          onClick={logout} 
          style={{ 
            marginBottom: '1rem', 
            background: '#ff4444', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '5px', 
            cursor: 'pointer',
            width: '100%'
          }}
        >
          Logout
        </button>
        <div className="new-conv" style={{ display: 'flex', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="New Conversation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 1, padding: '0.5rem', marginRight: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            onKeyPress={(e) => e.key === 'Enter' && createConversation()}
          />
          <button 
            onClick={createConversation}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0 1rem',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        </div>
        <ul className="conversations" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <li
                key={conv.id}
                style={{
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: selectedConversation?.id === conv.id ? '#34495e' : 'transparent',
                  ':hover': {
                    backgroundColor: '#34495e'
                  }
                }}
                onClick={() => selectConversation(conv)}
              >
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  flex: 1
                }}>
                  {conv.title}
                </span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setDeleteConfirmation({ show: true, conversationId: conv.id });
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#95a5a6',
                    cursor: 'pointer',
                    padding: '0.4rem 0.6rem',
                    marginLeft: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 107, 107, 0.15)';
                    e.target.style.color = '#ff6b6b';
                    e.target.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#95a5a6';
                    e.target.style.opacity = '0.6';
                  }}
                  title="Delete conversation"
                >
                  🗑️
                </button>
              </li>
            ))
          ) : (
            <p style={{ color: '#95a5a6', textAlign: 'center', marginTop: '1rem' }}>
              No conversations yet
            </p>
          )}
        </ul>
      </div>
      <div className="main-chat">
        {selectedConversation ? (
          <>
            <div className="chat-header">{selectedConversation.title}</div>
            <div className="messages">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.user.username === 'AI' ? 'ai' : 'user'} ${
                      msg.isSending ? 'sending' : ''
                    } ${msg.error ? 'error' : ''}`} 
                    style={{
                      marginBottom: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: msg.user.username === 'AI' ? '#4a6572' : '#5c7e8a',
                      alignSelf: msg.user.username === 'AI' ? 'flex-start' : 'flex-end',
                      opacity: msg.isSending ? 0.7 : 1,
                      borderLeft: msg.error ? '3px solid #ff6b6b' : 'none'
                    }}
                  >
                    <div><strong>{msg.user.username}:</strong></div>
                    <div className="message-content">
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                    {msg.isSending && (
                      <div style={{ fontSize: '0.8em', color: '#e0e0e0', marginTop: '4px' }}>
                        Sending...
                      </div>
                    )}
                    {msg.error && (
                      <div style={{ fontSize: '0.8em', color: '#ff6b6b', marginTop: '4px' }}>
                        Failed to send
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#fff', padding: '2rem' }}>
                  <p>No messages yet. Start a conversation!</p>
                </div>
              )}
            </div>
            <div className="input-area">
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type your message"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <>
            <div className="chat-header">Welcome to AI Chat</div>
            <div className="messages" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <h3>Select a conversation or create a new one to start chatting</h3>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modern Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setDeleteConfirmation({ show: false, conversationId: null })}
        >
          <div 
            style={{
              background: '#2c3e50',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'slideUp 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ margin: '0.5rem 0', color: '#fff' }}>Delete Conversation?</h2>
              <p style={{ margin: '0.5rem 0', color: '#95a5a6', fontSize: '0.95rem' }}>
                This action cannot be undone. This conversation will be permanently deleted.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmation({ show: false, conversationId: null })}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#34495e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#455a64';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#34495e';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConversation(deleteConfirmation.conversationId)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#ff5252';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 16px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ff6b6b';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;