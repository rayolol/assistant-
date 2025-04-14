import React from 'react'
import { Message } from '../types/message.tsx'
import ReactMarkdown from 'react-markdown'

const ChatMessages = ({ message }:  {message: Message}) => {
    const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex flex-col ${isUser ? 'bg-blue-500' : 'bg-gray-500'} rounded-lg p-2`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
    </div>
    )   
}

export default ChatMessages