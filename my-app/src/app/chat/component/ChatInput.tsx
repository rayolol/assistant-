
import React, { useState } from 'react';


const ChatInput: React.FC<{
    isStreaming: boolean,
    sendMessage: (arg0: string) => void}
    > = ({isStreaming, sendMessage}) => {
        
        const [input, setInput] = useState<string>('');

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (input.trim()) {
                sendMessage(input);
                setInput('');
            }
        };

    return (
        <div className="border w-200 rounded-[50px] focus:ring-2 focus:ring-blue-500 m-4 flex flex-col space-y-1.5 border-gray-600 bg-neutral-700 p-4">
            <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
                        placeholder="Type your message..."
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 border-none resize-none text-white rounded-full px-4 py-2 focus:outline-none  focus:border-transparent"
                    />
                <div className="flex items-center justify-end space-x-2">
                    
                   
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isStreaming}
                        className={`rounded-full p-2 ${!input.trim() || isStreaming
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        {isStreaming ? (
                            <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
    );
}

export default ChatInput;
