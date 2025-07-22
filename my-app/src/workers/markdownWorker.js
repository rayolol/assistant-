import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';

let buffer = '';
let sentCount = 0;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // …add other remark plugins here…
  .use(remarkRehype)
  .use(rehypeSanitize);

self.onmessage = ({ data: chunk }) => {
  buffer += chunk;

  // parse to mdast, transform to hast
  const mdast = processor.parse(buffer);
  const fullHast = processor.runSync(mdast);

  // all block-level children, including incomplete last one
  const all = Array.from(fullHast.children);

  // diff new nodes since last send
  const newNodes = all.slice(sentCount);
  sentCount = all.length;

  if (newNodes.length) {
    // send both complete and partial blocks
    self.postMessage(newNodes);
  }
};