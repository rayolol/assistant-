import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../../../../types/message';
import type { Components } from 'react-markdown';

interface StreamingMessageProps {
  message: Message;
  streamContent: string;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const StreamingMessage = memo(({ message, streamContent }: StreamingMessageProps) => {
  const content = streamContent || message.content;

  const components: Components = {
    p: ({ children, ...props }) => (
      <p className="whitespace-pre-wrap mb-4" {...props}>{children}</p>
    ),
    code: ({ inline, className, children, ...props }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={atomDark as any}
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
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="mb-1" {...props}>{children}</li>
    ),
    h1: ({ children, ...props }) => (
      <h1 className="text-2xl font-bold mb-4 mt-6" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-bold mb-3 mt-5" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-bold mb-2 mt-4" {...props}>{children}</h3>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 py-1 my-4 bg-gray-800/30 rounded-r" {...props}>{children}</blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-700" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-gray-800" {...props}>{children}</thead>
    ),
    tbody: ({ children, ...props }) => (
      <tbody className="divide-y divide-gray-700" {...props}>{children}</tbody>
    ),
    tr: ({ children, ...props }) => (
      <tr className="hover:bg-gray-800/50" {...props}>{children}</tr>
    ),
    th: ({ children, ...props }) => (
      <th className="px-4 py-2 text-left font-medium text-gray-300 border border-gray-700" {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-4 py-2 border border-gray-700" {...props}>{children}</td>
    ),
  };

  return (
    <div className="flex justify-start">
      <div className="pt-4 text-black dark:text-white max-w-full">
        <ReactMarkdown
          remarkPlugins={[
            [remarkGfm, { singleTilde: false }],
            remarkBreaks,
            remarkMath
          ]}
          rehypePlugins={[rehypeKatex]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

StreamingMessage.displayName = 'StreamingMessage';

export default StreamingMessage;
