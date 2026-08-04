import React from 'react';
import katex from 'katex';

interface LaTeXPreviewProps {
  text: string;
  className?: string;
}

export const LaTeXPreview: React.FC<LaTeXPreviewProps> = ({ text = '', className = '' }) => {
  // Parse text and render LaTeX equations enclosed in $...$ or $$...$$
  const renderLaTeX = (content: string) => {
    if (!content) return '';

    // Split text into text segments and math segments
    // Regex matches $$...$$ (group 1) or \[...\] (group 2) for display math
    // and $...$ (group 3) or \(...\) (group 4) for inline math
    const regex = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([\s\S]+?)\$|\\\(([\s\S]+?)\\\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    let keyCounter = 0;

    const renderPlainTextWithFractions = (text: string, baseKey: number) => {
      const fracRegex = /(\d+)\/(\d+)/g;
      const nodes: React.ReactNode[] = [];
      let lastFracIndex = 0;
      let fracMatch;
      let localCounter = 0;
      
      while ((fracMatch = fracRegex.exec(text)) !== null) {
        if (fracMatch.index > lastFracIndex) {
          nodes.push(<React.Fragment key={`t-${baseKey}-${localCounter++}`}>{text.substring(lastFracIndex, fracMatch.index)}</React.Fragment>);
        }
        try {
          const html = katex.renderToString(`\\frac{${fracMatch[1]}}{${fracMatch[2]}}`, { displayMode: false, throwOnError: false });
          nodes.push(<span key={`f-${baseKey}-${localCounter++}`} dangerouslySetInnerHTML={{ __html: html }} className="inline-block whitespace-nowrap px-0.5" />);
        } catch(e) {
          nodes.push(<span key={`f-${baseKey}-${localCounter++}`}>{fracMatch[0]}</span>);
        }
        lastFracIndex = fracRegex.lastIndex;
      }
      if (lastFracIndex < text.length) {
         nodes.push(<React.Fragment key={`t-${baseKey}-${localCounter++}`}>{text.substring(lastFracIndex)}</React.Fragment>);
      }
      return nodes;
    };

    while ((match = regex.exec(content)) !== null) {
      // Add plain text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${keyCounter++}`}>
            {renderPlainTextWithFractions(content.substring(lastIndex, match.index), keyCounter)}
          </span>
        );
      }

      const displayMath = match[1] || match[2];
      const inlineMath = match[3] || match[4];

      if (displayMath) {
        try {
          // Auto-convert standard slash fractions to LaTeX vertical fractions (e.g. 3/5 -> \frac{3}{5})
          const processedDisplayMath = displayMath.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
          const html = katex.renderToString(processedDisplayMath, {
            displayMode: true,
            throwOnError: false,
          });
          parts.push(
            <div
              key={`math-block-${keyCounter++}`}
              dangerouslySetInnerHTML={{ __html: html }}
              className="my-2 overflow-x-auto text-center"
            />
          );
        } catch (e) {
          parts.push(
            <code key={`math-error-${keyCounter++}`} className="text-red-500">
              {match[0]}
            </code>
          );
        }
      } else if (inlineMath) {
        try {
          // Auto-convert standard slash fractions to LaTeX vertical fractions (e.g. 3/5 -> \frac{3}{5})
          const processedInlineMath = inlineMath.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
          const html = katex.renderToString(processedInlineMath, {
            displayMode: false,
            throwOnError: false,
          });
          parts.push(
            <span
              key={`math-inline-${keyCounter++}`}
              dangerouslySetInnerHTML={{ __html: html }}
              className="inline-block whitespace-nowrap px-0.5"
            />
          );
        } catch (e) {
          parts.push(
            <code key={`math-error-${keyCounter++}`} className="text-red-500">
              {match[0]}
            </code>
          );
        }
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining plain text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {renderPlainTextWithFractions(content.substring(lastIndex), keyCounter)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className={`latex-container break-words ${className}`}>
      {renderLaTeX(text)}
    </div>
  );
};
