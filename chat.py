# chat.py

from chatloader import get_chat_engine, chat_store
from llama_index.core.llms import ChatMessage

session_id = "keerthi123"
chat_engine = get_chat_engine(session_id)

# Load and display previous messages if any
previous_messages = chat_store.get_messages(session_id)
if previous_messages:
    print("🔄 Resuming chat session...\n")
    for msg in previous_messages:
        role = "You" if msg.role == "user" else "Bot"
        print(f"{role}: {msg.content}")

# Chat loop
while True:
    query = input("\nYou: ")
    if query.lower() == "exit":
        print("👋 Chat ended.")
        break

    # Add user's message to history
    previous_messages.append(ChatMessage(role="user", content=query))

    # Get model response
    response = chat_engine.chat(query)
    print("Bot:", response.response)

    # Add bot's response to history
    previous_messages.append(ChatMessage(role="assistant", content=response.response))

    # Store updated messages in MongoDB
    chat_store.set_messages(session_id, previous_messages)


