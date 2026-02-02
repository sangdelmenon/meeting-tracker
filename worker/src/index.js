// Main Worker - handles routing and API endpoints

export { Conversation } from './conversation.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: POST /chat - send a message
    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const { message, conversationId = 'default' } = await request.json();
        
        if (!message) {
          return new Response(JSON.stringify({ error: 'Message required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get Durable Object stub
        const id = env.CONVERSATIONS.idFromName(conversationId);
        const stub = env.CONVERSATIONS.get(id);
        
        // Create a new request for the Durable Object
        const doRequest = new Request('http://internal/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        
        // Send message to conversation
        const response = await stub.fetch(doRequest);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Route: DELETE /chat - clear conversation
    if (url.pathname === '/chat' && request.method === 'DELETE') {
      try {
        const { conversationId = 'default' } = await request.json();
        
        // Get Durable Object stub
        const id = env.CONVERSATIONS.idFromName(conversationId);
        const stub = env.CONVERSATIONS.get(id);
        
        // Create a delete request
        const doRequest = new Request('http://internal/clear', {
          method: 'DELETE'
        });
        
        await stub.fetch(doRequest);

        return new Response(JSON.stringify({ success: true, message: 'Conversation cleared' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Route: GET /health - health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Default response
    return new Response('Meeting Tracker API', {
      headers: corsHeaders
    });
  }
};
