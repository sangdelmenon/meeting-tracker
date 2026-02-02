// API client for backend

const API_BASE = import.meta.env.DEV 
  ? '/api' 
  : 'https://meeting-tracker.deleepmenon-s.workers.dev';

export async function sendMessage(message, conversationId = 'default') {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  return response.json();
}

export async function clearConversation(conversationId = 'default') {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to clear conversation');
  }
  
  return response.json();
}
