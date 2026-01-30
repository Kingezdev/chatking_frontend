import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Chat = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo'); // default model

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/conversation/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(response.data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [id, fetchMessages]);

  const sendMessage = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/conversation/aichat/`, {
        prompt,
        model_name: model,
        conversation_id: id,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrompt('');
      fetchMessages(); // refresh messages
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.user.username !== 'AI' && <strong>{msg.user.username}:</strong>} {msg.message}
          </div>
        ))}
      </div>
      <select value={model} onChange={(e) => setModel(e.target.value)}>
        <option value="gpt-3.5-turbo">GPT-3.5</option>
        <option value="gpt-4">GPT-4</option>
      </select>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;