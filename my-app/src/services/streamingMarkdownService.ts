import type { HastNode } from '@/types';

type Subscriber = (nodes: HastNode[]) => void;

export class StreamingMarkdownService {
  private worker: Worker;
  private subs: Subscriber[] = [];

  constructor() {
    this.worker = new Worker(
      new URL('../workers/markdownWorker.js', import.meta.url)
    );

    this.worker.onmessage = ({ data }) => {
      this.subs.forEach(fn => fn(data));
    };
  }

  feed(chunk: string) {
    this.worker.postMessage(chunk);
  }

  subscribe(fn: Subscriber) {
    this.subs.push(fn);
    return () => {
      this.subs = this.subs.filter(s => s !== fn);
    };
  }

  terminate() {
    this.worker.terminate();
  }
}