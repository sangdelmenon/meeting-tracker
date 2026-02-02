// Durable Object - manages conversation state and AI interactions

import { SYSTEM_PROMPT, buildChatPrompt } from './prompts.js';

export class Conversation {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  // Helper to detect if message looks like meeting notes
  isMeetingNotes(message) {
    const indicators = [
      /meeting/i,
      /action items?:/i,
      /attendees?:/i,
      /discussion:/i,
      /\d+\.\s+\w+\s+(will|should|needs to)/i,
      /-\s+\w+\s+(will|should|needs to)/i,
    ];
    
    return indicators.some(pattern => pattern.test(message)) && message.length > 100;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'DELETE') {
      await this.state.storage.deleteAll();
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { message } = await request.json();
    const history = await this.state.storage.get('messages') || [];
    let actionItems = await this.state.storage.get('actionItems') || [];

    // Store meeting notes temporarily if detected
    const looksMeetingNotes = this.isMeetingNotes(message);
    if (looksMeetingNotes) {
      await this.state.storage.put('lastMeetingNotes', message);
    }

    // Check for extract command
    if (message.toLowerCase().includes('extract')) {
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      history.push(userMessage);

      // Get the stored meeting notes
      let meetingNotes = await this.state.storage.get('lastMeetingNotes');
      
      if (!meetingNotes) {
        // Try to find in history
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === 'user' && this.isMeetingNotes(history[i].content)) {
            meetingNotes = history[i].content;
            break;
          }
        }
      }

      if (meetingNotes) {
        // Direct extraction without AI - parse the meeting notes manually
        const lines = meetingNotes.split('\n');
        const extractedItems = [];
        
        for (const line of lines) {
          const trimmed = line.trim();
          // Look for action item patterns
          if (trimmed.match(/^[-*•]\s+(.+?)\s+(will|should|needs to|must)\s+(.+)/i) ||
              trimmed.match(/^\d+\.\s+(.+?)\s+(will|should|needs to|must)\s+(.+)/i)) {
            
            // Extract owner (name before will/should/needs)
            const ownerMatch = trimmed.match(/(?:[-*•]\s+|\d+\.\s+)(.+?)\s+(will|should|needs to|must)/i);
            const owner = ownerMatch ? ownerMatch[1].trim() : null;
            
            // Extract task (everything after will/should/needs)
            const taskMatch = trimmed.match(/(?:will|should|needs to|must)\s+(.+?)(?:\s+by\s+|\s+\(|$)/i);
            const task = taskMatch ? taskMatch[1].trim() : trimmed;
            
            // Detect priority keywords
            let priority = 'medium';
            if (trimmed.match(/urgent|asap|critical|high priority/i)) priority = 'high';
            if (trimmed.match(/low priority|nice to have|optional/i)) priority = 'low';
            
            // Extract due date
            const dateMatch = trimmed.match(/by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|end of week|tomorrow)/i);
            let dueDate = null;
            if (dateMatch) {
              const today = new Date();
              const dayMap = {
                'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
                'friday': 5, 'saturday': 6, 'sunday': 0
              };
              if (dateMatch[1].toLowerCase() in dayMap) {
                const targetDay = dayMap[dateMatch[1].toLowerCase()];
                const currentDay = today.getDay();
                let daysToAdd = targetDay - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7;
                const targetDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                dueDate = targetDate.toISOString().split('T')[0];
              }
            }
            
            extractedItems.push({
              id: crypto.randomUUID(),
              title: task,
              owner: owner,
              priority: priority,
              status: 'pending',
              dueDate: dueDate,
              createdAt: new Date().toISOString()
            });
          }
        }

        if (extractedItems.length > 0) {
          actionItems.push(...extractedItems);
          await this.state.storage.put('actionItems', actionItems);

          const assistantMessage = {
            role: 'assistant',
            content: `✓ Extracted ${extractedItems.length} action items! Check the sidebar to see them.`,
            timestamp: new Date().toISOString()
          };
          history.push(assistantMessage);
          await this.state.storage.put('messages', history);

          return new Response(JSON.stringify({
            response: assistantMessage.content,
            actionItems: extractedItems,
            allActionItems: actionItems,
            history: history
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const assistantMessage = {
            role: 'assistant',
            content: `I couldn't find clear action items in the meeting notes. Please make sure action items are formatted like:\n- John will complete the report by Friday\n- Sarah needs to review the document`,
            timestamp: new Date().toISOString()
          };
          history.push(assistantMessage);
          await this.state.storage.put('messages', history);

          return new Response(JSON.stringify({
            response: assistantMessage.content,
            actionItems: null,
            allActionItems: actionItems,
            history: history
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Mark as done
    const markDonePattern = /mark\s+(.+?)\s+as\s+done/i;
    const markDoneMatch = message.match(markDonePattern);
    
    if (markDoneMatch) {
      const searchTerm = markDoneMatch[1].toLowerCase();
      let found = false;
      
      actionItems = actionItems.map(item => {
        if (item.title.toLowerCase().includes(searchTerm) && item.status === 'pending') {
          found = true;
          return { ...item, status: 'done', completedAt: new Date().toISOString() };
        }
        return item;
      });
      
      if (found) {
        await this.state.storage.put('actionItems', actionItems);
        
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        history.push(userMessage);
        
        const assistantMessage = {
          role: 'assistant',
          content: `✓ Marked as done!`,
          timestamp: new Date().toISOString()
        };
        history.push(assistantMessage);
        
        await this.state.storage.put('messages', history);
        
        return new Response(JSON.stringify({
          response: assistantMessage.content,
          actionItems: null,
          allActionItems: actionItems,
          history: history
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    history.push(userMessage);
    
    if (looksMeetingNotes) {
      const assistantMessage = {
        role: 'assistant',
        content: `I've received your meeting notes. What would you like me to do?\n\n1. Extract action items\n2. Summarize the key points\n3. List attendees\n\nJust type "extract action items" to get started!`,
        timestamp: new Date().toISOString()
      };
      history.push(assistantMessage);
      await this.state.storage.put('messages', history);

      return new Response(JSON.stringify({
        response: assistantMessage.content,
        actionItems: null,
        allActionItems: actionItems,
        history: history
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For queries about action items
    if (message.toLowerCase().includes('pending') || message.toLowerCase().includes('list') || message.toLowerCase().includes('show')) {
      const pending = actionItems.filter(i => i.status === 'pending');
      let response = '';
      
      if (pending.length === 0) {
        response = 'No pending action items. Great job! 🎉';
      } else {
        response = `You have ${pending.length} pending action item(s):\n\n`;
        pending.forEach((item, idx) => {
          response += `${idx + 1}. ${item.title}`;
          if (item.owner) response += ` (${item.owner})`;
          if (item.dueDate) response += ` - Due: ${item.dueDate}`;
          response += `\n`;
        });
      }
      
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      };
      history.push(assistantMessage);
      await this.state.storage.put('messages', history);

      return new Response(JSON.stringify({
        response: response,
        actionItems: null,
        allActionItems: actionItems,
        history: history
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generic response for other queries
    const assistantMessage = {
      role: 'assistant',
      content: `I can help you with:\n• Extracting action items from meeting notes\n• Listing pending items\n• Marking items as done\n\nWhat would you like to do?`,
      timestamp: new Date().toISOString()
    };
    history.push(assistantMessage);
    await this.state.storage.put('messages', history);

    return new Response(JSON.stringify({
      response: assistantMessage.content,
      actionItems: null,
      allActionItems: actionItems,
      history: history
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
