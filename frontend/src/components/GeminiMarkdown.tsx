import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface GeminiMarkdownProps {
  content: string;
  className?: string;
}

const CodeBlock: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const language = (className || '').replace('language-', '') || 'code';

  return (
    <div className="my-3 rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800/80 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 uppercase font-medium text-slate-300">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          {language}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors px-2 py-0.5 rounded hover:bg-slate-800/60"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono text-cyan-200/90 leading-relaxed scrollbar-thin">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const GeminiMarkdown: React.FC<GeminiMarkdownProps> = ({ content, className = '' }) => {
  return (
    <div className={`gemini-markdown text-slate-100 text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-white mt-4 mb-2 pb-1.5 border-b border-slate-800 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-cyan-200 mt-4 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-slate-100 mt-3 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-200 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-2 text-slate-200 leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white tracking-wide">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-300">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="my-2.5 space-y-1.5 list-none pl-0.5">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 space-y-2 list-decimal list-outside pl-5 marker:text-cyan-400 marker:font-semibold">
              {children}
            </ol>
          ),
          li: ({ children, node }: any) => {
            // Check if within ol by inspecting parent or if ordered
            const isOrdered = node?.tagName === 'ol' || node?.parent?.tagName === 'ol';
            if (isOrdered) {
              return (
                <li className="text-slate-200 leading-relaxed pl-1">
                  {children}
                </li>
              );
            }
            return (
              <li className="flex items-start gap-2.5 text-slate-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                <span className="flex-1">{children}</span>
              </li>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 pr-3 py-2 border-l-4 border-cyan-400 bg-gradient-to-r from-cyan-950/40 to-transparent rounded-r-xl text-slate-200 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-3.5 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-md">
              <table className="w-full text-left text-xs border-collapse divide-y divide-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800/90 text-cyan-200 font-semibold uppercase text-[11px] tracking-wider">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 sm:p-3 font-semibold text-cyan-200 whitespace-nowrap">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/60">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-cyan-500/5 transition-colors">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="p-2.5 sm:p-3 text-slate-300 leading-normal">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3.5 border-slate-800/80" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium transition-colors"
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 inline ml-0.5" />
            </a>
          ),
          code: ({ className, children }: any) => {
            const isMultiline = String(children).includes('\n');
            if (isMultiline) {
              return <CodeBlock className={className}>{children}</CodeBlock>;
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 font-mono text-[11px] sm:text-xs text-cyan-300 font-medium">
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
