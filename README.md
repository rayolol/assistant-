# Memory Chat API

A FastAPI-based API for interacting with a memory-based chat agent system.

## Overview

This project implements a REST API using FastAPI to provide access to a memory-based chat agent. The API allows clients to send messages to the agent and receive responses.

## Features

- RESTful API built with FastAPI
- Memory-based chat agent integration
- CORS support for frontend applications
- Proper error handling and response formatting
- Interactive API documentation with Swagger UI

## API Endpoints

### Root Endpoint

- **URL**: `/`
- **Method**: `GET`
- **Description**: Returns a welcome message and information about available endpoints
- **Response Example**:
  ```json
  {
    "message": "Memory Chat API is running",
    "status": "online",
    "endpoints": {
      "/": "This welcome message",
      "/chat": "POST endpoint for chat interactions"
    }
  }
  ```

### Chat Endpoint

- **URL**: `/chat`
- **Method**: `POST`
- **Description**: Process a chat message and return the agent's response
- **Request Body**:
  ```json
  {
    "message": "Your message here"
  }
  ```
- **Response Example (Success)**:
  ```json
  {
    "status": "success",
    "response": "Agent's response to your message",
    "timestamp": "2023-04-04T12:34:56.789012"
  }
  ```
- **Response Example (Error)**:
  ```json
  {
    "status": "error",
    "error": "Error message",
    "timestamp": "2023-04-04T12:34:56.789012"
  }
  ```

## Getting Started

### Prerequisites

- Python 3.8+
- FastAPI
- Uvicorn
- Other dependencies as specified in your project

### Installation

1. Install the required dependencies:
   ```
   pip install fastapi uvicorn
   ```

2. Run the API server:
   ```
   python chatendpoint.py
   ```

   Or using Uvicorn directly:
   ```
   uvicorn chatendpoint:app --reload
   ```

3. The API will be available at `http://localhost:8000`

### Testing the API

1. Open your browser and navigate to `http://localhost:8000` to see the welcome message
2. Visit `http://localhost:8000/docs` to access the interactive API documentation
3. Use the test script to verify the API functionality:
   ```
   python test_api.py
   ```

## API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, you can access:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

- `chatendpoint.py`: Main FastAPI application
- `main.py`: Core functionality for the memory agent
- `agent.py`: Agent implementation
- `default_tools.py`: Tools used by the agent
- `prompts.py`: Prompt templates for the agent
- `config.json`: Configuration for the memory system
- `user.json`: User-specific configuration
- `test_api.py`: Script to test the API endpoints
