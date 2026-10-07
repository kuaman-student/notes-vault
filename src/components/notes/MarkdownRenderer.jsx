import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Copy, Check, Terminal, ExternalLink } from 'lucide-react';

function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 rounded text-sm font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
        {...props}
      >
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-5 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-mono uppercase font-semibold text-teal-400">
            {language || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed">
        <pre className="m-0 font-mono">
          <code>{children}</code>
        </pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body max-w-none prose dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h2 id={id} className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-3 scroll-mt-20 flex items-center gap-2">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h3 id={id} className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200 mt-6 mb-2 scroll-mt-20">
                {children}
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1.5 my-3 text-slate-700 dark:text-slate-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1.5 my-3 text-slate-700 dark:text-slate-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:text-teal-500">{children}</li>
          ),
          blockquote: ({ children }) => {
            return (
              <blockquote className="my-5 p-4 rounded-xl border-l-4 border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 text-slate-800 dark:text-slate-200 shadow-sm">
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
          td: ({ children }) => (
            <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60">{children}</td>
          ),
          hr: () => <hr className="my-8 border-slate-200 dark:border-slate-800" />,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              <span>{children}</span>
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
