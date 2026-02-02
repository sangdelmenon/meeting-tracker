# 📋 Meeting Tracker

An AI-powered meeting notes and action item tracker built on Cloudflare's infrastructure. Automatically extracts, organizes, and tracks action items from meeting notes using Llama 3.3.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/sangdelmenon/meeting-tracker)

**Live Demo**: [https://meeting-tracker.pages.dev](https://meeting-tracker.pages.dev)

---

## ✨ Features

- 🤖 **AI-Powered Extraction**: Uses Llama 3.3 via Cloudflare Workers AI to intelligently extract action items
- 💬 **Natural Language Interface**: Chat-based interaction with quick action buttons
- 📊 **Task Management**: Track pending and completed action items with owners and due dates
- 💾 **Persistent Memory**: Durable Objects store conversation history and action items
- ⚡ **Real-time Updates**: Instant UI updates with React frontend
- 🔄 **Conversation History**: Maintains context across sessions
- 🎯 **Priority Detection**: Automatically assigns priority levels to tasks
- 📅 **Due Date Parsing**: Extracts and calculates due dates from natural language

---

## 🏗️ Architecture

### Backend (Cloudflare Workers)
- **Workers AI**: Llama 3.3 for natural language processing
- **Durable Objects**: SQLite-backed persistent storage for conversations and action items
- **Cloudflare Workers**: Serverless API endpoints

### Frontend (React + Vite)
- **React 18**: Modern UI with hooks
- **Vite**: Fast development and optimized builds
- **Cloudflare Pages**: Static site hosting with edge deployment

### Tech Stack
```
Backend:
├── Cloudflare Workers (JavaScript)
├── Workers AI (Llama 3.3)
├── Durable Objects (SQLite storage)
└── Wrangler CLI

Frontend:
├── React + Vite
├── CSS3 (custom styling)
└── Fetch API
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Cloudflare account (free tier works!)
- Wrangler CLI

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sangdelmenon/meeting-tracker.git
cd meeting-tracker
```

2. **Install dependencies**
```bash
# Backend
cd worker
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure Cloudflare**
```bash
# Login to Cloudflare
wrangler login

# The wrangler.toml is already configured
```

4. **Run locally**
```bash
# Terminal 1 - Backend
cd worker
npm run dev
# Runs on http://localhost:8787

# Terminal 2 - Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 📦 Deployment

### Automatic Deployment (Recommended)

This project auto-deploys on push to `main`:
- **Worker**: Deploys via GitHub Actions
- **Frontend**: Deploys via Cloudflare Pages integration

### Manual Deployment

**Deploy Worker:**
```bash
cd worker
wrangler deploy
```

**Deploy Frontend:**
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=meeting-tracker
```

---

## 🎯 Usage

### Basic Workflow

1. **Paste Meeting Notes**
```
   Product Team Meeting - Feb 2, 2026
   
   Attendees: Sarah (PM), Mike (Engineering), Lisa (Design)
   
   Action Items:
   - Sarah will finalize requirements by Friday
   - Mike needs to review API architecture by Wednesday
   - Lisa should create mockups by next Monday
```

2. **Extract Action Items**
   - Click the "✨ Extract Action Items" button
   - Or type: "extract action items"

3. **View in Sidebar**
   - See all pending tasks organized by priority
   - Track owner, due date, and status

4. **Manage Tasks**
   - `mark requirements as done` - Complete a task
   - `list pending items` - See what's left
   - `show all` - View everything

### Supported Commands

| Command | Description |
|---------|-------------|
| `extract action items` | Extract tasks from meeting notes |
| `list pending items` | Show incomplete action items |
| `show all` | Display all action items |
| `mark X as done` | Mark a task as complete |

---

## 📁 Project Structure
```
meeting-tracker/
├── worker/                 # Cloudflare Worker (Backend)
│   ├── src/
│   │   ├── index.js       # API routes & CORS
│   │   ├── conversation.js # Durable Object class
│   │   └── prompts.js     # AI system prompts
│   ├── wrangler.toml      # Worker configuration
│   └── package.json
│
├── frontend/              # React Application
│   ├── src/
│   │   ├── App.jsx       # Main component
│   │   ├── api.js        # API client
│   │   └── App.css       # Styles
│   ├── vite.config.js    # Vite configuration
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── deploy.yml    # CI/CD pipeline
│
└── README.md
```

---

## 🔌 API Reference

### Endpoints

#### `POST /chat`
Send a message to the AI assistant.

**Request:**
```json
{
  "message": "Your message here",
  "conversationId": "default"
}
```

**Response:**
```json
{
  "response": "AI response text",
  "actionItems": [...],
  "allActionItems": [...],
  "history": [...]
}
```

#### `DELETE /chat`
Clear conversation and all action items.

**Request:**
```json
{
  "conversationId": "default"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation cleared"
}
```

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

## 🎨 Features in Detail

### Action Item Extraction
- **Pattern Matching**: Detects "X will/should/needs to Y" patterns
- **Owner Detection**: Identifies person responsible
- **Priority Assignment**: Based on urgency keywords (urgent, asap, critical)
- **Due Date Parsing**: Converts "by Friday", "next Monday" to dates

### Conversation Memory
- **Durable Objects**: Stores full conversation history
- **Context Aware**: AI remembers previous messages
- **Persistent**: Survives page reloads and sessions

### User Experience
- **Quick Actions**: One-click extraction buttons
- **Visual Indicators**: Priority badges, status icons
- **Real-time Updates**: Instant sidebar refresh
- **Loading States**: Animated typing indicators

---

## 🛠️ Development

### Environment Variables

None required! The app works out of the box with Cloudflare's infrastructure.

### Adding Features

**To add a new command:**
1. Update `src/prompts.js` with command description
2. Add handler in `src/conversation.js`
3. Test locally with `npm run dev`

**To modify UI:**
1. Edit `frontend/src/App.jsx` for structure
2. Update `frontend/src/App.css` for styling
3. Hot reload shows changes instantly

---

## 📊 Performance

- **Cold Start**: < 100ms (Cloudflare Workers)
- **AI Response**: 2-5s (Llama 3.3)
- **Global Edge**: Deployed to 275+ locations
- **Uptime**: 99.99% (Cloudflare SLA)

---

## 🤝 Contributing

Contributions are welcome! This project was built as part of a Cloudflare application assignment.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- Built with [Cloudflare Workers AI](https://ai.cloudflare.com/)
- Uses [Llama 3.3](https://www.llama.com/) by Meta
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)

---

## 📧 Contact

**San Delmenon** - [@sangdelmenon](https://github.com/sangdelmenon)

**Project Link**: [https://github.com/sangdelmenon/meeting-tracker](https://github.com/sangdelmenon/meeting-tracker)

**Live Demo**: [https://meeting-tracker.pages.dev](https://meeting-tracker.pages.dev)

---

## 🎯 Assignment Requirements Met

This project fulfills all requirements for the Cloudflare AI application:

- ✅ **LLM Integration**: Llama 3.3 via Workers AI
- ✅ **Workflow/Coordination**: Cloudflare Workers + Durable Objects
- ✅ **User Input**: Chat interface with voice-ready architecture
- ✅ **Memory/State**: Durable Objects with SQLite storage
- ✅ **Production Ready**: Deployed and publicly accessible

---

<p align="center">Made with ❤️ and ☁️ Cloudflare</p>
