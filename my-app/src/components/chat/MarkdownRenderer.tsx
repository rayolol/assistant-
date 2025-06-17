import { renderMarkdown } from '@/lib/renderer';

type Props = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className = '' }: Props) {
  console.dir(renderMarkdown(content), { depth: null });
  return (
    <div className={`text-white prose dark:prose-invert ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
}
