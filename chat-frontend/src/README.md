# Frontend Source Code Structure

This directory contains the source code for the Memory Chat frontend application.

## Directory Structure

- **api/** - API client for communicating with the backend
- **components/** - Reusable UI components
- **pages/** - Page-level components
- **styles/** - CSS files for styling
- **types/** - TypeScript type definitions

## Key Files

- **App.jsx** - Main application component
- **index.jsx** - Entry point for the React application

## Main Components

### ModernChat (pages/ModernChat.jsx)

The main chat interface component that provides:
- Conversation management
- Message display with Markdown support
- Dark/light mode
- Responsive design

### API Client (api/api.ts)

Handles communication with the backend API:
- Sending messages
- Fetching conversation history
- Managing conversations

### Type Definitions (types/)

- **message.tsx** - Defines the Message and Conversation types
- **UserStore.tsx** - Manages user state with Zustand

## Styling

The application uses a combination of:
- Tailwind CSS for utility classes
- Custom CSS for specific components
- Dark mode support
