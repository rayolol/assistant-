import { renderMarkdown } from '@/lib/renderer';

type Props = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className = '' }: Props) {
  const html = renderMarkdown(content);

  return (
    <div
      className={`prose dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
