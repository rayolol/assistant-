import { useEffect, useRef, useState } from 'react';
import { StreamingMarkdownService } from '@/services/StreamingMarkdownService';
import type { HastNode } from '@/types';

export function useStreamingMarkdown(
  stream: AsyncIterable<string>,
  maxBlocks = 100
): HastNode[] {
  const serviceRef = useRef<StreamingMarkdownService>(null);
  const [blocks, setBlocks] = useState<HastNode[]>([]);

  useEffect(() => {
    serviceRef.current = new StreamingMarkdownService();
    const unsubscribe = serviceRef.current.subscribe(newNodes => {
      setBlocks(prev => {
        const combined = [...prev, ...newNodes];
        return combined.length > maxBlocks
          ? combined.slice(combined.length - maxBlocks)
          : combined;
      });
    });

    (async () => {
      for await (const chunk of stream) {
        serviceRef.current?.feed(chunk);
      }
    })();

    return () => {
      unsubscribe();
      serviceRef.current?.terminate();
    };
  }, [stream, maxBlocks]);

  return blocks;
}