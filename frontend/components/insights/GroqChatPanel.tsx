"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  User,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const scrollSuggestions = (direction: "left" | "right") => {
    if (suggestionsRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      suggestionsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleSuggestionsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (suggestionsRef.current && e.deltaY !== 0) {
      suggestionsRef.current.scrollLeft += e.deltaY;
    }
  };

  // Auto-scroll on new message or loading state
  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Determine active suggestions: latest assistant message suggestions, or starter prompts if empty
  const latestAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const activeSuggestions =
    latestAssistantMsg?.structured?.suggestions && latestAssistantMsg.structured.suggestions.length > 0
      ? latestAssistantMsg.structured.suggestions
      : messages.length === 0
      ? STARTER_PROMPTS
      : [];

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

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const panelContent = (
    <div
      className={`bg-white border border-grey-border rounded-2xl shadow-card flex flex-col transition-all duration-200 overflow-hidden ${
        isFullscreen
          ? "fixed inset-3 md:inset-8 z-50 shadow-2xl h-[calc(100vh-1.5rem)] md:h-[calc(100vh-4rem)]"
          : "w-full h-[720px] max-h-[85vh]"
      }`}
    >
      {/* 3.A Assistant Header */}
      <div className="bg-charcoal text-white rounded-t-2xl px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm border-b border-charcoal-deep">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-charcoal-deep border border-yellow/40 flex items-center justify-center shrink-0 shadow-inner">
            <SochIQIcon size={26} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-heading text-base sm:text-lg font-bold text-white tracking-tight truncate">
                SochIQ AI Assistant
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow text-charcoal shadow-2xs shrink-0">
                Optional AI
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5 truncate leading-normal">
              Ask analytical questions, explore trends and uncover insights from your dataset.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:text-white transition-colors rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 font-medium cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-white/80 hover:text-white transition-colors rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Copilot"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3.B Conversation Area - ONLY this section scrolls vertically */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAFAFA]">
        {messages.length === 0 ? (
          <div className="min-h-full flex flex-col justify-center items-center text-center p-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-yellow/20 border border-yellow/40 flex items-center justify-center mb-3 shadow-xs">
              <Bot className="w-7 h-7 text-charcoal" />
            </div>
            <h4 className="font-heading text-base sm:text-lg font-bold text-charcoal mb-1.5">
              Grounded Intelligence Ready
            </h4>
            <p className="text-xs sm:text-sm text-grey-muted leading-relaxed mb-4">
              Ask natural language questions about your dataset. SochIQ interprets summary distributions,
              missing value profiles, key correlations, and quality scores without transmitting raw data records.
            </p>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-grey-border text-xs text-grey-muted font-medium shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statistical summary verification active</span>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {msg.role === "user" ? (
                /* User message - right aligned */
                <div className="flex justify-end items-start gap-2.5">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-charcoal text-white px-4 sm:px-5 py-3 text-xs sm:text-sm shadow-xs">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <span className="block text-[10px] text-white/60 text-right mt-1.5 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-grey-subtle border border-grey-border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <User className="w-4 h-4 text-charcoal" />
                  </div>
                </div>
              ) : (
                /* Assistant message - left aligned */
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-charcoal border border-yellow/50 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4 text-yellow" />
                  </div>
                  <div className="flex-1 min-w-0 rounded-2xl rounded-tl-xs bg-white border border-grey-border p-4 sm:p-5 shadow-2xs space-y-3">
                    {msg.structured ? (
                      <StructuredAIResponseView
                        data={msg.structured}
                        rawText={msg.content}
                        onSelectSuggestion={(sug) => handleSend(sug)}
                        isLoading={isLoading}
                      />
                    ) : (
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-charcoal">
                        {msg.content}
                      </div>
                    )}
                    <div className="text-[10px] text-grey-muted pt-2 border-t border-grey-border/60 flex items-center justify-between font-mono">
                      <span>Grounded strictly on dataset aggregate statistics</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-charcoal border border-yellow/50 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs animate-pulse">
              <Bot className="w-4 h-4 text-yellow" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-white border border-grey-border px-5 py-3.5 shadow-2xs flex items-center gap-3 text-xs text-charcoal">
              <Loader2 className="w-4 h-4 text-charcoal animate-spin shrink-0" />
              <span className="font-medium text-grey-muted">
                Synthesizing statistical context and generating observations...
              </span>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={chatBottomRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-200 text-red-900 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="truncate">{error}</span>
          </div>
          {messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <button
              type="button"
              onClick={() => handleSend(messages[messages.length - 1].content)}
              disabled={isLoading}
              className="text-xs font-semibold text-red-700 hover:text-red-900 underline shrink-0 cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* 3.E Suggested Inquiries with smooth horizontal scrolling */}
      {activeSuggestions && activeSuggestions.length > 0 && (
        <div className="shrink-0 px-5 sm:px-6 py-2.5 bg-white border-t border-grey-border">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-charcoal fill-yellow" />
              <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider">
                Suggested Inquiries
              </span>
            </div>
            {/* Scroll navigation arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollSuggestions("left")}
                className="p-1 rounded-md text-grey-muted hover:text-charcoal hover:bg-grey-subtle transition-colors border border-grey-border cursor-pointer shadow-2xs"
                title="Scroll suggestions left"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => scrollSuggestions("right")}
                className="p-1 rounded-md text-grey-muted hover:text-charcoal hover:bg-grey-subtle transition-colors border border-grey-border cursor-pointer shadow-2xs"
                title="Scroll suggestions right"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div
            ref={suggestionsRef}
            onWheel={handleSuggestionsWheel}
            className="flex items-center gap-2 overflow-x-auto horizontal-chips-scrollbar pb-1.5 pt-0.5 whitespace-nowrap scroll-smooth"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#D4D4D8 #F4F4F5",
            }}
          >
            {activeSuggestions.map((sug, idx) => (
              <div key={idx} className="shrink-0">
                <SuggestionChip
                  text={sug}
                  onClick={(val) => handleSend(val)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3.F Fixed Message Composer */}
      <div className="shrink-0 bg-white border-t border-grey-border p-4 sm:p-5 rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about revenue, missing values, trends, distributions or get analytical insights..."
              className="w-full resize-none px-4 py-2.5 rounded-xl border border-grey-border bg-grey-subtle/30 text-xs sm:text-sm focus:outline-none focus:border-charcoal focus:bg-white transition-colors placeholder:text-grey-muted/60 leading-normal"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-yellow hover:bg-yellow-hover text-charcoal text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 h-[46px] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
                <span className="hidden sm:inline">Inquiring...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-charcoal" />
                <span>Inquire</span>
              </>
            )}
          </button>
        </form>

        {/* 3.G Privacy Footer */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-grey-muted gap-2 pt-2 border-t border-grey-border/40">
          <span className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate sm:whitespace-normal">
              Only approved statistical summaries are sent for AI interpretation. Raw dataset records are not transmitted.
            </span>
          </span>
          <span className="hidden md:inline font-medium text-[10px] text-grey-muted/80 shrink-0">
            Powered by Groq Cloud
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Background backdrop if fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setIsFullscreen(false)}
        />
      )}
      {panelContent}
    </>
  );
}
