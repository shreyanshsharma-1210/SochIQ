"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, Bot, AlertCircle } from "lucide-react";
import { api } from "@/lib/apiClient";

interface GroqChatPanelProps {
  summaryContext: any;
  qualityContext: any;
}

export default function GroqChatPanel({ summaryContext, qualityContext }: GroqChatPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.askAI(question, summaryContext, qualityContext);
      setAnswer(response);
    } catch (err: any) {
      setError(err.message || "AI Assistant is currently unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="diwali-card p-5 border border-gold/30 bg-gradient-to-br from-surface via-primary-light/10 to-surface">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-text">Groq Cloud AI Assistant</h3>
            <p className="text-[11px] text-text-muted">Ask natural questions based strictly on aggregate summaries</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full diwali-badge-saffron">
          Optional Feature
        </span>
      </div>

      <form onSubmit={handleAsk} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which columns have high variance? What are the key takeaways?"
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-gold transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="diwali-button-primary px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>Inquire</span>
        </button>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {answer && (
        <div className="mt-4 p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary">
            <Bot className="w-4 h-4 text-gold" />
            <span>AI Analytical Interpretation</span>
          </div>
          <div className="text-sm text-text whitespace-pre-line leading-relaxed">{answer}</div>
          <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-text-muted">
            🛡️ Privacy Guarantee: Only statistical summaries were analyzed. Zero raw row records were transmitted.
          </div>
        </div>
      )}
    </div>
  );
}

