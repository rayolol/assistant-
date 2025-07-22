import { ReactElement } from "react";
import { createRoot } from "react-dom/client";


export class StreamingMDService {
    //TODO: implement performant streaming service
    private renderQueue: string[] = []
    private cache = new Map<string, ReactElement>();
    private textBuffer = ""

    constructor(private processor: any) {}

    private normalizeNewlines = (text: string): string => {
        // 1) Convert literal "\\n" to real newlines
        let t = text.replace(/\\n/g, '\n');
      
        // 2) Normalize Windows CRLF
        t = t.replace(/\r\n/g, '\n');
      
        // 3) Replace any run of 2+ newlines with exactly two newlines (paragraph break)
        t = t.replace(/\n{2,}/g, '\n\n');
      
        // 4) Only replace single newlines that are between complete words
        // This prevents joining incomplete words during streaming
        t = t.replace(/(?<=\w)\n(?=\w)/g, ' ');
      
        // 5) Trim spaces around paragraphs
        return t.replace(/[ \t]*\n\n[ \t]*/g, '\n\n').trim();
    }
    
    private isCompleteNode(node: any, buffer: string): boolean {
        const start = node.position.start.offset;
        const end   = node.position.end.offset;
        const snippet = buffer.slice(start, end);
      
        switch (node.type) {
          case 'paragraph':
            return /\n{2,}$/.test(buffer.slice(0, snippet.length + 2));  // ends with blank line
          case 'code':
            const fence = buffer.slice(start, start + 3); // "```"
            const re = new RegExp('^' + fence + '[\\s\\S]*' + fence + '$', 'm');
            return re.test(snippet);
          case 'table':
            return /\|[-: ]+\|/.test(snippet) && /\n\n/.test(buffer.slice(end));
          default:
            return true; // inline or flow JSX — assume complete
        }
      }
      
    
    private extractBlocks = (buffer: string) => {
        const tree = this.processor.parse(buffer);
        console.log("tree of the current markdown: ", tree)
        let endoffset = 0;
        let wordscount = 0;
        const completeNodes = [];
    
        for(const node of tree.children) {
            if (node.position?.end?.offset !== undefined && this.isCompleteNode(node, buffer)) {
                completeNodes.push(node);
                endoffset = node.position.end.offset;
                console.log("appended")
            } else {
                console.log('skipped')
                break;
            }
        }
    
        const completeText = buffer.slice(0, endoffset);
        const remainingText = buffer.slice(endoffset);
    
        return { completeText, remainingText}
    }
    
    public onNewChunk = (chunk: string) => {
        console.log("RAW chunk: ", chunk)
        
        // Add new chunk to buffer
        this.textBuffer = chunk;
        
        // Process the accumulated buffer
        const { completeText, remainingText } = this.extractBlocks(this.textBuffer)

        this.renderQueue.push(completeText)
        const jsx = this.processQueue()
        return jsx

    }
    
    private processQueue = () => {
        while(this.renderQueue.length) {
            const block = this.renderQueue.shift()!;
            const jsx = this.cache.has(block) ? this.cache.get(block)! : (()=> {
                const el = this.processor.processSync(block).result as ReactElement
                this.cache.set(block, el)
                return el
            })();
            return jsx
        }
    }
    
    private mountBlock = (jsx: ReactElement) => {
       
    }
}