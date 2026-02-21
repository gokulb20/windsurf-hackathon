import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import "./ChatMessage.css";

function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "model-row"}`}>
      {!isUser && (
        <div className="avatar model-avatar">
          <Bot size={16} />
        </div>
      )}
      <div className={`bubble ${isUser ? "user-bubble" : "model-bubble"}`}>
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {isUser && (
        <div className="avatar user-avatar">
          <User size={16} />
        </div>
      )}
    </div>
  );
}

export default ChatMessage;
