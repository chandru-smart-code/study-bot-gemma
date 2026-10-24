import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  onPracticeExam?: (text: string) => void;
  onSaveToNotes?: (text: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onPracticeExam,
  onSaveToNotes,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Render markdown lines cleanly
  const renderFormattedContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const currentCode = codeBuffer.join('\n');
          const idx = codeBlockIndex++;
          elements.push(
            <div key={`code-${i}`} className="my-3 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 text-neutral-100 text-sm">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-800 text-xs text-neutral-400 font-mono">
                <span>{codeLanguage || 'code'}</span>
                <button
                  onClick={() => handleCopyCode(currentCode, idx)}
                  className="flex items-center gap-1 hover:text-neutral-200 transition-colors cursor-pointer"
                  title="Copy code"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto font-mono text-xs leading-relaxed">
                <code>{currentCode}</code>
              </pre>
            </div>
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-4 mb-2 flex items-center gap-2">
            {formatInlineText(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mt-5 mb-2.5 pb-1 border-b border-neutral-200 dark:border-neutral-800">
            {formatInlineText(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mt-6 mb-3">
            {formatInlineText(line.slice(2))}
          </h1>
        );
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-4 border-neutral-200 dark:border-neutral-800" />);
        continue;
      }

      // Blockquotes / Callout notes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`bq-${i}`} className="my-2.5 pl-3.5 py-1 border-l-4 border-emerald-500 bg-emerald-500/10 text-neutral-800 dark:text-neutral-200 rounded-r-md text-sm italic">
            {formatInlineText(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Lists
      if (line.match(/^[\*\-•]\s/)) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 my-0.5">
            {formatInlineText(line.replace(/^[\*\-•]\s/, ''))}
          </li>
        );
        continue;
      }

      // Numbered Lists
      const numMatch = line.match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        elements.push(
          <div key={`num-${i}`} className="flex items-start gap-2 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 my-1">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 select-none min-w-[1.25rem]">
              {numMatch[1]}.
            </span>
            <div className="flex-1">{formatInlineText(numMatch[2])}</div>
          </div>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        continue;
      }

      // Regular paragraph
      elements.push(
        <p key={`p-${i}`} className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 my-1.5">
          {formatInlineText(line)}
        </p>
      );
    }

    return elements;
  };

  // Helper to format bold, italic, inline code, and math formulas
  const formatInlineText = (text: string): React.ReactNode => {
    // Split by inline code `...`
    const codeParts = text.split(/(`[^`]+`)/);
    return codeParts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-medium border border-neutral-200 dark:border-neutral-700">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Parse bold **...** and italic *...*
      const boldParts = part.split(/(\*\*[^*]+\*\*)/);
      return boldParts.map((bPart, bIndex) => {
        if (bPart.startsWith('**') && bPart.endsWith('**')) {
          return (
            <strong key={`b-${index}-${bIndex}`} className="font-semibold text-neutral-900 dark:text-neutral-100">
              {bPart.slice(2, -2)}
            </strong>
          );
        }

        // Check for math delimiters $...$
        const mathParts = bPart.split(/(\$[^$]+\$)/);
        return mathParts.map((mPart, mIndex) => {
          if (mPart.startsWith('$') && mPart.endsWith('$')) {
            return (
              <span key={`m-${index}-${bIndex}-${mIndex}`} className="font-serif italic text-emerald-600 dark:text-emerald-400 px-1 bg-neutral-100/70 dark:bg-neutral-800/60 rounded">
                {mPart.slice(1, -1)}
              </span>
            );
          }
          return mPart;
        });
      });
    });
  };

  const hasExamQuestions = content.toLowerCase().includes('question') && (content.includes('A)') || content.includes('B)'));

  return (
    <div className="markdown-body space-y-1">
      {renderFormattedContent()}

      {/* Quick contextual action bar */}
      {(hasExamQuestions || onSaveToNotes) && (
        <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-wrap gap-2 text-xs">
          {hasExamQuestions && onPracticeExam && (
            <button
              onClick={() => onPracticeExam(content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition cursor-pointer font-medium"
            >
              🎯 Practice These in Exam Arena
            </button>
          )}
          {onSaveToNotes && (
            <button
              onClick={() => onSaveToNotes(content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition cursor-pointer font-medium"
            >
              📥 Save to Notes Library
            </button>
          )}
        </div>
      )}
    </div>
  );
};
