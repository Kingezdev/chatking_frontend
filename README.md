# AI Chat Frontend

A modern React-based frontend for an AI-powered chat application. This application provides a user-friendly interface for interacting with AI models through a Django REST API backend.

## Features

- 🔐 User Authentication (Login/Register)
- 💬 Real-time Chat Interface
- 🤖 Multiple AI Model Support (GPT-3.5, GPT-4)
- 📝 Conversation Management
- 🎨 Modern UI with Responsive Design
- ⚡ Fast Development with Vite
- 🔍 Markdown Support for AI Responses

## Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite 7
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Markdown Rendering**: React Markdown
- **Styling**: CSS Modules
- **Code Quality**: ESLint

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Django Backend API (running on port 8000)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd /path/to/django/project/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Update `VITE_API_BASE_URL` to match your backend URL:
     ```
     VITE_API_BASE_URL=http://localhost:8000
     ```

## Usage

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Code Quality

Run ESLint to check code quality:

```bash
npm run lint
```

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── Chat.jsx      # Chat interface
│   │   ├── Dashboard.jsx # Main dashboard
│   │   ├── Login.jsx     # Login form
│   │   ├── Register.jsx  # Registration form
│   │   └── ErrorBoundary.jsx
│   ├── styles/           # CSS files
│   ├── utils/            # Utility functions
│   └── main.jsx          # Application entry point
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000` |

## API Integration

The frontend communicates with a Django REST API backend. Key endpoints:

- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `GET /api/conversation/listconversation/` - List user conversations
- `POST /api/conversation/newconversation/` - Create new conversation
- `GET /api/conversation/conversation/{id}/` - Get conversation messages
- `POST /api/conversation/aichat/` - Send message to AI
- `GET /api/conversation/listmodels/` - Get available AI models

## Authentication

The application uses JWT tokens for authentication:
- Access tokens are stored in localStorage
- Automatic token refresh is handled by the backend
- Protected routes redirect to login if not authenticated

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Serve the `dist/` directory with any static file server

3. For production, ensure the `VITE_API_BASE_URL` points to your live backend

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-server:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and run tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## Code Quality

- Follow React best practices
- Use functional components with hooks
- Maintain consistent code style
- Run `npm run lint` before committing
- Write meaningful commit messages

## Troubleshooting

### Common Issues

1. **API Connection Issues**:
   - Ensure the backend is running on the correct port
   - Check `VITE_API_BASE_URL` in `.env`
   - Verify CORS settings in the backend

2. **Build Errors**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **Authentication Problems**:
   - Clear localStorage: `localStorage.clear()` in browser console
   - Check token expiration

## License

This project is part of a larger Django application. See the main project license for details.
