import useWebSocket, { ReadyState } from "react-use-websocket";
import { startTransition, useReducer, useRef, useEffect } from "react";




type Action =
  | { type: "START" }
  | { type: "CHUNK"; payload: string }
  | { type: "COMPLETE" }
  | { type: "RESET" };
  interface State {
    text: string;
    streaming: boolean;
  }
  
  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "START":
        return { ...state, text: "", streaming: true };
      case "CHUNK":
        // append payload
        return { ...state, text: state.text + action.payload };
      case "COMPLETE":
        return { ...state, streaming: false };
      case "RESET":
        return { text: "", streaming: false };
      default:
        return state;
    }
  }

  interface options {
    onComplete: (data: any) => void;
    onChunk: (data: any) => void;
    onStart:(data: any) => void;
    onEvent: (data: any) => void
  }

  export function useChatStream(wsUrl: string | null, options?: options) {
    const [state, dispatch] = useReducer(reducer, {
      text: "",
      streaming: false,
    });

    // Store latest options in a ref
    const optionsRef = useRef(options);
    useEffect(() => {
      optionsRef.current = options;
    }, [options]);

    // Set up WS
    const { lastMessage, readyState, sendJsonMessage } = useWebSocket(wsUrl || "", {
      onOpen: () => console.log("WS open"),
      onClose: () => console.log("WS closed"),
      onError: (e) => console.error("WS error", e),
      shouldReconnect: () => Boolean(wsUrl),
      onMessage: (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          switch (msg.type) {
            case "start":
              dispatch({ type: "START" });
              optionsRef.current?.onStart?.(msg);
              break;
            case "chunk":
              startTransition(() => {
                dispatch({ type: "CHUNK", payload: msg.data.chunk });
                console.log("chunk received:", msg.data.chunk);
              });
              optionsRef.current?.onChunk?.(msg);
              break;
            case "complete":
              dispatch({ type: "COMPLETE" });
              optionsRef.current?.onComplete?.(state.text);
              break;
            case "event":
              optionsRef.current?.onEvent?.(msg);
              break;
            default:
                console.log("unkown message type. got: ", msg)
          }
        } catch {
          // fallback: treat raw text as chunk
          dispatch({ type: "CHUNK", payload: evt.data });
        }
      },
    });
  
    const isConnected = readyState === ReadyState.OPEN;
  
    return {
      sendJsonMessage,
      isConnected,
      state,
    };
  }