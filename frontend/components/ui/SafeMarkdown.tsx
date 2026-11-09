"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export default function SafeMarkdown({ content, className = "" }: SafeMarkdownProps) {
  if (!content) return null;

  return (
    <div className={`prose-sm max-w-none text-text text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="font-serif text-lg font-bold text-text mt-3 mb-2 border-b border-border/50 pb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="font-serif text-base font-semibold text-text mt-3 mb-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="font-serif text-sm font-semibold text-primary mt-2.5 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0 text-text/90" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1 text-text/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1 text-text/90" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-normal" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-gold/60 pl-3 my-2 text-xs italic text-text-muted bg-amber-50/40 py-1 rounded-r" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-surface border border-border text-[12px] font-mono text-primary font-medium" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2 rounded-xl bg-surface border border-border overflow-x-auto text-xs font-mono text-text">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-surface/80 border-b border-border text-text font-semibold" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 text-text font-medium" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-t border-border/40 text-text/90" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-text" {...props} />
          ),
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-gold underline underline-offset-2 transition-colors"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
