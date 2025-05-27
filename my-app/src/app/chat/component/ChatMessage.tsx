import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../../types/message';
import { memo } from 'react';

const ChatMessage = memo(({ message }: { message: Message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`p-4 rounded-full ${isUser
                    ? 'bg-zinc-600 text-accent-foreground'
                    : 'pt-4 text-accent-foreground max-w-full'}`}
            >
                {isUser ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            p: ({ node, children }) => (
                                <p className="whitespace-pre-wrap mb-4">{children}</p>
                            ),
                            code({ node, inline, className, children, ...props}: {
                                node?: any;
                                inline?: boolean;
                                className?: string;
                                children: React.ReactNode;
                                [key: string]: any;
                            }) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={atomDark}
                                        language={match[1]}
                                        PreTag="div"
                                        className="my-4 rounded-md"
                                        showLineNumbers={true}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            ul: ({ children }) => (
                                <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                            ),
                            h1: ({ children }) => (
                                <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-500 pl-4 py-1 my-4 bg-gray-800/30 rounded-r">{children}</blockquote>
                            ),
                            table: ({ children }) => (
                                <div className="overflow-x-auto my-4">
                                    <table className="min-w-full border-collapse border border-gray-700">{children}</table>
                                </div>
                            ),
                            thead: ({ children }) => (
                                <thead className="bg-gray-800">{children}</thead>
                            ),
                            tbody: ({ children }) => (
                                <tbody className="divide-y divide-gray-700">{children}</tbody>
                            ),
                            tr: ({ children }) => (
                                <tr className="hover:bg-gray-800/50">{children}</tr>
                            ),
                            th: ({ children }) => (
                                <th className="px-4 py-2 text-left font-medium text-gray-300 border border-gray-700">{children}</th>
                            ),
                            td: ({ children }) => (
                                <td className="px-4 py-2 border border-gray-700">{children}</td>
                            ),
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                )}
            </div>
        </div>
    );
});

ChatMessage.displayName = 'ChatMessage';


export default ChatMessage;