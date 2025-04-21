# Memory Chat Frontend

This is the frontend for the Memory Chat application, a modern chat interface that communicates with a Python FastAPI backend.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Frontend Architecture

The application has two main interface designs:

1. **Original Design** - The initial implementation
2. **Modern Design** - A ChatGPT-like interface with enhanced features

### Modern Chat Interface

The modern interface provides:

- Clean, minimalist design similar to ChatGPT
- Conversation management with sidebar
- Markdown rendering for messages
- Code syntax highlighting
- Dark/light mode support
- Responsive design for all screen sizes

## Documentation

For more detailed information, see:

- [Modern Chat Implementation Guide](./MODERN-CHAT-IMPLEMENTATION-GUIDE.md) - Detailed documentation of the new interface
- [Troubleshooting](./TROUBLESHOOTING.md) - Solutions for common issues
- [Dependencies](./DEPENDENCIES-TO-INSTALL.md) - Required packages for the modern interface

## API Integration

The frontend communicates with the backend API through the following endpoints:

- `POST /chat` - Send a message
- `GET /chat/{conversation_id}/{user_id}` - Get message history
- `GET /chat/conversations/{user_id}` - Get conversations
- `POST /chat/conversations/{user_id}` - Create a new conversation