from models import ChatMessage


def build_full_prompt(memories: list, history: list[ChatMessage] ,current_conversation_id: str, user_input: str) -> str:
    """build the prompt of the assistant"""
    try:
        results = memories.get("results", [])
        memory_str = ''

        for memory in results:
            memory_str += f"Memory: {memory['memory']}\n"

        if history:
            history_str = ''
            for msg in history:
                if msg.conversation_id == current_conversation_id:
                    history_str += f"Role: {msg.role}\nContent: {msg.content}\n"


        full_prompt = (
            f"System:\n"
            f"##current user message:\n"
            f"{user_input}"
            f"##chat history:\n"
            f"{history_str if history_str else 'No conversation history yet.'}"
            f"##relevant memories:\n"
            f"{memory_str if memory_str else 'No memories found.'}"

        )

        # Make sure to return the full_prompt
        return full_prompt

    except Exception as e:
        print(f"Error in build_full_prompt: {e}")
        import traceback
        traceback.print_exc()
        return f"Sorry, I encountered an error: {str(e)}"
