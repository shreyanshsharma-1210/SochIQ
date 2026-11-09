"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, AlertCircle, RotateCcw, ShieldCheck, User } from "lucide-react";
import { SochIQIcon } from "@/components/brand/SochIQLogo";
import { api } from "@/lib/apiClient";
import { ChatMessage } from "@/types/ai";
import StructuredAIResponseView from "./StructuredAIResponseView";
import SuggestionChip from "./SuggestionChip";

interface GroqChatPanelProps {
  summaryContext: any;
  qualityContext: any;
}

const STARTER_PROMPTS = [
  "Which category generates the highest revenue?",
  "What are the biggest data quality issues?",
  "Summarize key dataset dimensions and highlights",
  "Which numeric variables show high variance or unusual values?",
];

export default function GroqChatPanel({ summaryContext, qualityContext }: GroqChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || question).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsLoading(true);

    try {
      const response = await api.askAI(textToSend, summaryContext, qualityContext);
      
      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        content: response.answer,
        structured: response.structured || null,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Unable to reach SochIQ AI Assistant.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="sochiq-card p-5 sm:p-6 bg-white border border-grey-border flex flex-col shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-grey-border mb-4">
        <div className="flex items-center gap-3">
          <SochIQIcon size={32} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm sm:text-base font-bold text-charcoal">
                SochIQ AI Assistant
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow/25 text-charcoal border border-yellow/50">
                Optional AI
              </span>
            </div>
            <p className="text-xs text-grey-muted">
              Interactive analytics queries grounded strictly on aggregate statistics
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-grey-muted hover:text-charcoal transition-colors rounded-lg hover:bg-grey-subtle"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Messages area or Starter state */}
      {messages.length === 0 ? (
        <div className="py-4">
          <div className="p-4 rounded-xl bg-grey-subtle/70 border border-grey-border mb-4">
            <p className="text-xs font-semibold text-charcoal uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-charcoal" />
              <span>Grounded Intelligence Ready</span>
            </p>
            <p className="text-xs text-grey-muted leading-relaxed">
              Ask questions about distributions, missing data, summary metrics, or trends. All answers are validated against your dataset’s statistical profile.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-grey-muted uppercase tracking-wider mb-2">
              Suggested Starter Queries
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <SuggestionChip
                  key={idx}
                  text={prompt}
                  onClick={(val) => handleSend(val)}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.role === "user" ? (
                <div className="flex justify-end items-start gap-2">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-charcoal text-white px-4 py-2.5 text-xs sm:text-sm shadow-xs">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className="block text-[10px] text-white/60 text-right mt-1">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-grey-subtle border border-grey-border flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-charcoal" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-yellow/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-charcoal" />
                  </div>
                  <div className="flex-1 rounded-2xl rounded-tl-sm bg-white border border-grey-border p-4 shadow-xs">
                    {msg.structured ? (
                      <StructuredAIResponseView
                        data={msg.structured}
                        rawText={msg.content}
                        onSelectSuggestion={(sug) => handleSend(sug)}
                        isLoading={isLoading}
                      />
                    ) : (
                      <div>
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-charcoal">
                          {msg.content}
                        </div>
                      </div>
                    )}
                    <span className="block text-[10px] text-grey-muted mt-2 pt-2 border-t border-grey-border">
                      Grounded via SochIQ • {msg.timestamp}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-grey-muted py-2 px-1">
              <div className="w-6 h-6 rounded-full bg-yellow/20 flex items-center justify-center shrink-0 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 text-charcoal animate-spin" />
              </div>
              <span className="italic">Synthesizing statistical context...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Bar */}
      <div className="pt-2 border-t border-grey-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about revenue, missing values, trends, distributions... (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-grey-border bg-white text-xs sm:text-sm focus:outline-none focus:border-charcoal transition-colors placeholder:text-grey-muted/60 leading-normal"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2.5 rounded-xl bg-charcoal text-white text-xs font-semibold hover:bg-charcoal-deep transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 h-[52px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-yellow" />
            ) : (
              <>
                <Send className="w-4 h-4 text-yellow" />
                <span className="hidden sm:inline">Inquire</span>
              </>
            )}
          </button>
        </form>

        {/* Privacy badge */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-grey-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Only approved statistical summaries are sent for AI interpretation. Raw dataset records are not transmitted.</span>
          </span>
          <span className="hidden sm:inline text-[10px] text-grey-muted">
            Powered by Groq Cloud
          </span>
        </div>
      </div>
    </div>
  );
}
