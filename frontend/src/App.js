import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ChatMessage from "./components/ChatMessage";
import { Send, Bot, Trash2 } from "lucide-react";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content: "Hello! I'm powered by Google Gemini. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...updatedMessages, { role: "model", content: data.reply }]);
    } catch (err) {
      setMessages([
        ...updatedMessages,
        { role: "model", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "model",
        content: "Chat cleared. How can I help you?",
      },
    ]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <Bot size={24} className="header-icon" />
          <span className="header-title">Gemini AI Chat</span>
        </div>
        <button className="clear-btn" onClick={clearChat} title="Clear chat">
          <Trash2 size={18} />
        </button>
      </header>

      <main className="chat-window">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="input-area">
        <textarea
          className="input-box"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Gemini... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={loading}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </footer>
    </div>
  );
}

export default App;
