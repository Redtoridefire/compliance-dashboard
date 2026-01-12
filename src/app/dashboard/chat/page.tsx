"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  {
    icon: Shield,
    question: "How do I comply with NYDFS 500 requirements?",
    category: "Framework Guidance"
  },
  {
    icon: FileText,
    question: "What controls map between ISO 27001 and SOC 2?",
    category: "Control Mapping"
  },
  {
    icon: AlertTriangle,
    question: "What are my highest priority compliance gaps?",
    category: "Gap Analysis"
  },
  {
    icon: CheckCircle2,
    question: "Help me write a policy for access control",
    category: "Policy Writing"
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI compliance assistant. I can help you with:\n\n• **Framework guidance** - Understanding requirements from NYDFS 500, ISO 27001, SOC 2, and more\n• **Control mapping** - Finding equivalent controls across frameworks\n• **Gap analysis** - Identifying and prioritizing compliance gaps\n• **Policy writing** - Drafting security policies and procedures\n• **Remediation planning** - Creating action plans to address gaps\n\nHow can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const sessionStr = localStorage.getItem("cybercomply_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: text,
          organization_id: session?.organization_id
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please check your connection and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-cyber-primary">•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2) }} />
          </div>
        );
      }
      // Numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numberedMatch) {
        return (
          <div key={i} className="flex gap-2 ml-2">
            <span className="text-cyber-primary font-medium">{numberedMatch[1]}.</span>
            <span dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />
          </div>
        );
      }
      // Regular lines
      return line ? (
        <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
      ) : (
        <br key={i} />
      );
    });
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Compliance Assistant</h1>
        <p className="text-cyber-text-muted mt-1">
          Get instant guidance on compliance frameworks, control mappings, and remediation strategies
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <Card className="flex-1 flex flex-col border-cyber-border bg-cyber-surface min-h-0">
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <Avatar className={`w-8 h-8 shrink-0 ${
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-cyber-primary to-cyber-secondary"
                      : "bg-cyber-surface-light"
                  }`}>
                    <AvatarFallback className="bg-transparent">
                      {message.role === "assistant" ? (
                        <Bot className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-cyber-text" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      message.role === "user"
                        ? "bg-cyber-primary text-white"
                        : "bg-cyber-bg border border-cyber-border"
                    }`}
                  >
                    <div className="text-sm space-y-2">
                      {formatMessage(message.content)}
                    </div>
                    <p className={`text-xs mt-2 ${
                      message.role === "user" ? "text-blue-200" : "text-cyber-text-dim"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 bg-gradient-to-br from-cyber-primary to-cyber-secondary">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="w-4 h-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-cyber-bg border border-cyber-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-cyber-text-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-cyber-border">
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about compliance frameworks, control mappings, or get remediation advice..."
                  className="resize-none min-h-[60px] max-h-[120px]"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="px-4 self-end"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-cyber-text-dim mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Questions Sidebar */}
        <div className="w-80 shrink-0 space-y-4">
          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyber-warning" />
                Suggested Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(item.question)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-lg border border-cyber-border hover:border-cyber-primary hover:bg-cyber-bg transition-all group disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <item.icon className="w-4 h-4 text-cyber-text-muted group-hover:text-cyber-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-cyber-text group-hover:text-cyber-primary">
                        {item.question}
                      </p>
                      <p className="text-xs text-cyber-text-dim mt-1">
                        {item.category}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-cyber-border bg-cyber-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-cyber-text-muted">
              <p>
                <strong className="text-cyber-text">Be specific</strong> - Include framework names and control IDs for precise answers
              </p>
              <p>
                <strong className="text-cyber-text">Ask for examples</strong> - Request sample policies, procedures, or implementation guidance
              </p>
              <p>
                <strong className="text-cyber-text">Follow up</strong> - Ask clarifying questions to dive deeper into topics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
