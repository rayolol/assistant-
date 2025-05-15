
import React, { useState, useRef, useEffect } from 'react';


const ChatInput: React.FC<{
    isStreaming: boolean,
    sendMessage: (arg0: string) => void}
    > = ({isStreaming, sendMessage}) => {
        
        const [input, setInput] = useState<string>('');
        const textareaRef = useRef<HTMLTextAreaElement>(null);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (input.trim()) {
                sendMessage(input);
                setInput('');
            }
        };

        useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    return (
        <div className="max-w-4xl mx-auto w-full min-w-[500px]">
            <div className="text-black dark:text-white border  rounded-[50px] focus:ring-2 m-4  border-gray-300 bg-gray-200 dark:bg-neutral-700 p-4 ">
                <form onSubmit={handleSubmit} className= "relative">
                    <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit(e)}
                                placeholder="Type your message..."
                                disabled={isStreaming}
                                rows={1}
                                className="w-full border-none resize-none text-white rounded-full px-4 py-2 focus:outline-none min-h-[56px] max-h-[200px]  focus:border-transparent"
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
                    </form>
                </div>
            </div>
            
    );
}

export default ChatInput;
