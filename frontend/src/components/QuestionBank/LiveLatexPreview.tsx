import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import { Rnd } from 'react-rnd';
import { getPhotoUrl } from '../../utils/photo';

export interface FloatingImage {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PaperSection {
  id: string;
  name: string; // e.g., "SECTION - I"
  instructions: string; // e.g., "Note: (i) Answer ALL the following questions.\n(ii) Each question carries 1 Mark."
  marksPerQuestion: string; // e.g., "1", "2"
  totalQuestions: string; // e.g., "12"
  content: string; // Markdown/LaTeX content
}

export interface LiveLatexPreviewProps {
  subjectContents?: Record<string, string>;
  content?: string;
  sections?: PaperSection[];
  examName: string;
  maxMarks: string;
  time: string;
  instructions: string[];
  examDate?: string;
  examClass?: string;
  examSubject?: string;
  selectedSubjects?: string[];
  logoBase64?: string;
  isDoubleColumn?: boolean;
  inlineImages?: Record<string, FloatingImage | string>;
  onImageUpdate?: (id: string, updates: Partial<FloatingImage>) => void;
  onImageDelete?: (id: string) => void;
  fontSize?: string;
  questionSpacing?: string;
  showHeader?: boolean;
  realSubject?: string;
  hideHeaderSubjectIfEmpty?: boolean;
  showSubjectHeadings?: boolean;
  parseMode?: 'smart' | 'raw';
  showPageBorder?: boolean;
  pageBorderPadding?: string;
  pageBorderThickness?: string;
  pageBorderStyle?: string;
}

export const LiveLatexPreview: React.FC<LiveLatexPreviewProps> = ({
  subjectContents,
  content,
  sections,
  examName,
  maxMarks,
  time,
  instructions,
  examDate = '',
  examClass = '',
  examSubject = '',
  selectedSubjects = [],
  logoBase64 = '',
  isDoubleColumn = false,
  inlineImages = {},
  onImageUpdate,
  onImageDelete,
  fontSize = 'medium',
  questionSpacing = 'normal',
  showHeader = true,
  realSubject = '',
  hideHeaderSubjectIfEmpty = false,
  showSubjectHeadings = true,
  parseMode = 'smart',
  showPageBorder = false,
  pageBorderPadding = 'medium',
  pageBorderThickness = 'medium',
  pageBorderStyle = 'solid'
}) => {
  // Helper to balance braces in math strings so KaTeX doesn't crash on bad AI output
  const balanceMath = (math: string) => {
    let m = math.trim();
    if (m.endsWith('\\')) m = m.slice(0, -1);

    let unescapedOpen = 0, unescapedClose = 0;
    let escapedOpen = 0, escapedClose = 0;

    for (let i = 0; i < m.length; i++) {
      if (m[i] === '\\') {
        if (m[i + 1] === '{') escapedOpen++;
        else if (m[i + 1] === '}') escapedClose++;
        i++;
      } else if (m[i] === '{') unescapedOpen++;
      else if (m[i] === '}') unescapedClose++;
    }

    if (escapedOpen > escapedClose) m = m + '\\}'.repeat(escapedOpen - escapedClose);
    else if (escapedClose > escapedOpen) m = '\\{'.repeat(escapedClose - escapedOpen) + m;

    if (unescapedOpen > unescapedClose) m = m + '}'.repeat(unescapedOpen - unescapedClose);
    else if (unescapedClose > unescapedOpen) m = '{'.repeat(unescapedClose - unescapedOpen) + m;

    return m;
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-[10pt]';
      case 'large': return 'text-[12pt]';
      case 'xlarge': return 'text-[14pt]';
      default: return 'text-[11pt]';
    }
  };

  const getSpacingClasses = () => {
    switch (questionSpacing) {
      case 'compact': return 'leading-tight';
      case 'relaxed': return 'leading-normal';
      default: return 'leading-snug';
    }
  };

  const getBlockGap = () =>
    questionSpacing === 'compact' ? 0.1 : questionSpacing === 'relaxed' ? 0.7 : 0.3; // rem

  const renderLatex = (text: string) => {
    try {
      // Fix AI often outputting \\) instead of \)
      let fixedText = text.replace(/\\\\\)/g, '\\)');
      fixedText = fixedText.replace(/\\\\\(/g, '\\(');
      fixedText = fixedText.replace(/\\\\\]/g, '\\]');
      fixedText = fixedText.replace(/\\\\\[/g, '\\[');

      // Support for native inline images and editor-inserted images with custom sizes and positioning
      let withImages = fixedText.replace(/\[IMAGE:(.*?)\]/g, (match, inner) => {
        const cleanInner = (inner || '').trim();
        const parts = cleanInner.split(/[|:,]/).map((s: string) => s.trim());
        const urlOrId = parts[0];
        const params = parts.slice(1);

        let src = urlOrId;
        if (inlineImages && inlineImages[urlOrId]) {
          const imgData = inlineImages[urlOrId];
          src = typeof imgData === 'string' ? imgData : imgData.dataUrl;
        }
        if (src && !src.startsWith('data:') && !src.startsWith('http')) {
          src = getPhotoUrl(src) || src;
        }

        let maxWidth = '100%';
        let maxHeight = '240px'; // Generous default (was 160px)
        let width = 'auto';
        let height = 'auto';
        let alignment = 'center';

        for (const p of params) {
          const lower = p.toLowerCase();
          if (lower === 'small' || lower === 's') {
            maxHeight = '130px';
            maxWidth = '220px';
          } else if (lower === 'medium' || lower === 'm') {
            maxHeight = '240px';
            maxWidth = '100%';
          } else if (lower === 'large' || lower === 'l') {
            maxHeight = '380px';
            maxWidth = '100%';
          } else if (lower === 'xlarge' || lower === 'xl' || lower === 'full') {
            maxHeight = '550px';
            width = '100%';
          } else if (lower === 'left') {
            alignment = 'left';
          } else if (lower === 'right') {
            alignment = 'right';
          } else if (lower === 'center') {
            alignment = 'center';
          } else if (lower === 'float-right' || lower === 'floatright') {
            alignment = 'float-right';
          } else if (lower === 'float-left' || lower === 'floatleft') {
            alignment = 'float-left';
          } else if (/^w=(\d+(?:px|%|rem)?)$/i.test(p)) {
            const val = p.match(/^w=(\d+(?:px|%|rem)?)$/i)![1];
            width = val.endsWith('%') || val.endsWith('px') || val.endsWith('rem') ? val : `${val}px`;
            maxHeight = 'none';
          } else if (/^h=(\d+(?:px|%|rem)?)$/i.test(p)) {
            const val = p.match(/^h=(\d+(?:px|%|rem)?)$/i)![1];
            height = val.endsWith('%') || val.endsWith('px') || val.endsWith('rem') ? val : `${val}px`;
            maxHeight = height;
          } else if (/^(\d+)px$/i.test(p)) {
            width = p;
            maxHeight = 'none';
          } else if (/^(\d+)%$/i.test(p)) {
            width = p;
            maxHeight = 'none';
          } else if (/^(\d+)x(\d+)$/i.test(p)) {
            const m = p.match(/^(\d+)x(\d+)$/i)!;
            width = `${m[1]}px`;
            height = `${m[2]}px`;
            maxHeight = height;
          }
        }

        let marginStyle = 'margin: 8px auto;';
        let displayStyle = 'display: block;';
        let floatStyle = '';

        if (alignment === 'center') {
          marginStyle = 'margin: 10px auto;';
          displayStyle = 'display: block;';
        } else if (alignment === 'right') {
          marginStyle = 'margin: 8px 0 8px auto;';
          displayStyle = 'display: block;';
        } else if (alignment === 'left') {
          marginStyle = 'margin: 8px auto 8px 0;';
          displayStyle = 'display: block;';
        } else if (alignment === 'float-right') {
          floatStyle = 'float: right; clear: both;';
          marginStyle = 'margin: 4px 0 12px 16px;';
          displayStyle = 'display: inline-block;';
          if (maxWidth === '100%') maxWidth = '50%';
        } else if (alignment === 'float-left') {
          floatStyle = 'float: left; clear: both;';
          marginStyle = 'margin: 4px 16px 12px 0;';
          displayStyle = 'display: inline-block;';
          if (maxWidth === '100%') maxWidth = '50%';
        }

        return `<img src="${src}" style="max-width:${maxWidth}; max-height:${maxHeight}; width:${width}; height:${height}; object-fit:contain; ${marginStyle} ${displayStyle} ${floatStyle}" />`;
      });

      let normalized = withImages.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
      normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

      // Auto-balance single $ line-by-line so an unclosed $ on one line never spans into subsequent lines
      const normLines = normalized.split('\n');
      const balancedLines = normLines.map(line => {
        const withoutDouble = line.replace(/\$\$[\s\S]*?\$\$/g, '');
        const dollars = (withoutDouble.match(/(?<!\\)\$/g) || []).length;
        if (dollars % 2 !== 0) {
          return line + '$';
        }
        return line;
      });
      normalized = balancedLines.join('\n');

      const parts = normalized.split(/(\$\$[\s\S]*?\$\$)/g);
      return parts.map(part => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          let math = balanceMath(part.slice(2, -2));
          // Smart Math Spacing: auto-convert 3+ spaces to \quad and 2 spaces to \ 
          math = math.replace(/ {3,}/g, ' \\quad ').replace(/ {2}/g, ' \\ ');
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        }

        const inlineParts = part.split(/(\$[\s\S]*?\$)/g);
        return inlineParts.map(inlinePart => {
          if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
            let math = balanceMath(inlinePart.slice(1, -1));
            // Smart Math Spacing: auto-convert 3+ spaces to \quad and 2 spaces to \ 
            math = math.replace(/ {3,}/g, ' \\quad ').replace(/ {2}/g, ' \\ ');
            try {
              return katex.renderToString(math, { displayMode: false, throwOnError: false });
            } catch {
              return inlinePart;
            }
          }

          let textPart = inlinePart;

          // Auto-render any bare LaTeX expressions outside $ (e.g. \sqrt{2}, \frac{a}{b}, \vec{a}, \ln, \Delta)
          if (/\\(?:sqrt|frac|vec|hat|mathbf|mathrm|text|operatorname|alpha|beta|theta|pi|times|pm|le|ge|in|ln|log|sin|cos|tan|cot|sec|csc|dots|cdots|ldots|Delta|neq|ne)\b/.test(textPart)) {
            textPart = textPart.replace(/(\\(?:sqrt|frac|vec|hat|mathbf|mathrm|text|operatorname)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\[a-zA-Z]+(?:\^\{[^{}]*\}|_\{[^{}]*\})*)/g, (match) => {
              try {
                return katex.renderToString(match, { displayMode: false, throwOnError: false });
              } catch {
                return match;
              }
            });
          }

          if (parseMode === 'raw') {
            for (let i = 0; i < 3; i++) {
              textPart = textPart.replace(/\\textbf{([^{}]*)}/g, '<b>$1</b>');
              textPart = textPart.replace(/\\textit{([^{}]*)}/g, '<i>$1</i>');
              textPart = textPart.replace(/\\underline{([^{}]*)}/g, '<u>$1</u>');
            }
            textPart = textPart.replace(/\\section\*{([^{}]*)}/g, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
            textPart = textPart.replace(/\\section{([^{}]*)}/g, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
            textPart = textPart.replace(/\\subsection\*{([^{}]*)}/g, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
            textPart = textPart.replace(/\\subsection{([^{}]*)}/g, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
            textPart = textPart.replace(/\\begin{center}([\s\S]*?)\\end{center}/g, '<div class="text-center w-full flex justify-center">$1</div>');
            textPart = textPart.replace(/\\newpage/g, '<div style="page-break-after: always" class="w-full h-8 border-b-2 border-dashed border-slate-300 my-4 print:border-0 print:h-0"></div>');
          }

          // Preserve tabs and multiple spaces 1:1
          textPart = textPart.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
          textPart = textPart.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));
          return textPart.replace(/\n/g, '<br/>');
        }).join('');
      }).join('');
    } catch (e) {
      console.error("KaTeX Error", e);
      return text.replace(/\n/g, '<br/>');
    }
  };

  const parseTextToBlocks = (text: string, subject: string, elements: JSX.Element[]) => {
    if (!text || text.trim() === '') return;
    // Regex to match option layout tags e.g. [2x2], [1x1], [1x4], [vertical], [horizontal]
    const layoutTagRegex = /\[(?:LAYOUT:)?(1x4|1\*4|4cols?|horizontal|2x2|2\*2|2cols?|1x1|1\*1|4x1|4\*1|vertical|1col)\]/gi;

    // Normalize text blocks so that questions are ALWAYS separated cleanly and options never detach
    let normalizedText = text.replace(/\r\n/g, '\n');
    // Ensure all options (A), (B), (C), (D) or (a), (b), (c), (d) are NEVER detached by double newlines
    normalizedText = normalizedText.replace(/(\n\s*)\n+(\s*\(?[A-Da-d][\)\.]\s+)/gi, '$1$2');
    // Ensure every question start (e.g. "\n2. ", "\n10. ", "\n18. ") is preceded by \n\n so questions are never accidentally merged
    normalizedText = normalizedText.replace(/([^\n])\n+(\s*(?:\d+|[IVXLCDM]+)\.\s+)/gi, '$1\n\n$2');
    const rawBlocks = normalizedText.split(/(\n\n+)/);

    for (let i = 0; i < rawBlocks.length; i += 2) {
      let block = rawBlocks[i];
      if (block.trim() === '') continue; // Skip pure whitespace blocks

      const separator = i + 1 < rawBlocks.length ? rawBlocks[i + 1] : '';
      const newlineCount = (separator.match(/\n/g) || []).length;
      const extraNewlines = Math.max(0, newlineCount - 2);
      const baseGap = getBlockGap();
      const marginBottom = extraNewlines > 0
        ? `calc(${baseGap}rem + ${extraNewlines * 0.75}rem)`
        : `${baseGap}rem`;

      // Ensure single-line options (A), (B), (C), (D) or (a), (b), (c), (d) are cleanly split to newlines
      // IMPORTANT: NEVER eat English words ending in d., b., c., a. like "land. ", "sound. ", "food. ", "mind. "
      block = block.replace(/([^\n\s])\s+(\([B-Db-d]\))\s*/g, '$1\n$2 ');
      block = block.replace(/([^\n\s])(?:\s{2,}|\t)([B-Db-d]\.)\s+/g, (match, charBefore, opt) => {
        if (/[a-zA-Z0-9]/.test(charBefore)) return match; // Belongs to an English word like "land."
        return `${charBefore}\n${opt} `;
      });

      // Support both uppercase (A) (B) (C) (D) and lowercase (a) (b) (c) (d) options (must be preceded by newline, whitespace or start of line)
      const optMatchA = /(?:^|\n|\s{2,}|\t)\s*\(A\)/.test(block);
      const optMatchB = /(?:^|\n|\s{2,}|\t)\s*\(B\)/.test(block);
      const optMatchC = /(?:^|\n|\s{2,}|\t)\s*\(C\)/.test(block);
      const optMatchD = /(?:^|\n|\s{2,}|\t)\s*\(D\)/.test(block);
      const hasUpperOptions = optMatchA && optMatchB && optMatchC && optMatchD;
      const hasLowerOptions = (/(?:^|\n|\s{2,}|\t)\s*\(a\)\.?\s*/.test(block)) &&
        (/(?:^|\n|\s{2,}|\t)\s*\(b\)\.?\s*/.test(block)) &&
        (/(?:^|\n|\s{2,}|\t)\s*\(c\)\.?\s*/.test(block)) &&
        (/(?:^|\n|\s{2,}|\t)\s*\(d\)\.?\s*/.test(block));

      if (!hasUpperOptions && hasLowerOptions) {
        block = block
          .replace(/(?:^|\n|\s{2,}|\t)\(a\)\.?\s*/g, '\n(A) ')
          .replace(/(?:^|\n|\s{2,}|\t)\(b\)\.?\s*/g, '\n(B) ')
          .replace(/(?:^|\n|\s{2,}|\t)\(c\)\.?\s*/g, '\n(C) ')
          .replace(/(?:^|\n|\s{2,}|\t)\(d\)\.?\s*/g, '\n(D) ');
      }

      const hasOptions = hasUpperOptions || (/(?:^|\n|\s{2,}|\t)\s*\(A\)/.test(block) && /(?:^|\n|\s{2,}|\t)\s*\(B\)/.test(block) && /(?:^|\n|\s{2,}|\t)\s*\(C\)/.test(block) && /(?:^|\n|\s{2,}|\t)\s*\(D\)/.test(block));

      const blockContent = (
        <React.Fragment key={`${subject}-${i}`}>
          {!hasOptions ? (
            (() => {
              const cleanBlockNoOpt = block.replace(layoutTagRegex, '');
              const qNumMatch2 = cleanBlockNoOpt.match(/^(\d+|[IVXLCDM]+)\.\s+/i);
              if (qNumMatch2) {
                const numStr = qNumMatch2[1];
                const restText = cleanBlockNoOpt.substring(qNumMatch2[0].length);
                return (
                  <div className={`question-item break-inside-avoid flex items-baseline whitespace-pre-wrap ${getFontSizeClass()} ${getSpacingClasses()}`}>
                    <strong className="flex-shrink-0 w-8 md:w-9 text-left font-bold">{numStr}.</strong>
                    <div className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(restText.trimEnd()) }} />
                  </div>
                );
              }
              return (
                <div
                  className={`question-item break-inside-avoid min-w-0 whitespace-pre-wrap ${getFontSizeClass()} ${getSpacingClasses()}`}
                  dangerouslySetInnerHTML={{ __html: renderLatex(cleanBlockNoOpt) }}
                />
              );
            })()
          ) : (
            (() => {
              // Check for explicit option layout tag in this question block
              const tagMatches = Array.from(block.matchAll(layoutTagRegex));
              let forcedLayout: '1x4' | '2x2' | '1x1' | null = null;
              if (tagMatches.length > 0) {
                const lastVal = tagMatches[tagMatches.length - 1][1].toLowerCase().replace('*', 'x');
                if (lastVal === '1x4' || lastVal.startsWith('4col') || lastVal === 'horizontal') {
                  forcedLayout = '1x4';
                } else if (lastVal === '2x2' || lastVal.startsWith('2col')) {
                  forcedLayout = '2x2';
                } else if (lastVal === '1x1' || lastVal === '4x1' || lastVal.startsWith('1col') || lastVal === 'vertical') {
                  forcedLayout = '1x1';
                }
              }

              // Make regex robust: match options separated by newline or whitespace
              const optARegex = /(?:^|\n|\s+)\(A\)\s*(.*?)(?=\n\s*\(B\)|\s+\(B\)|\t\(B\)|$)/s;
              const optBRegex = /(?:^|\n|\s+)\(B\)\s*(.*?)(?=\n\s*\(C\)|\s+\(C\)|\t\(C\)|$)/s;
              const optCRegex = /(?:^|\n|\s+)\(C\)\s*(.*?)(?=\n\s*\(D\)|\s+\(D\)|\t\(D\)|$)/s;
              const optDRegex = /(?:^|\n|\s+)\(D\)\s*(.*)/s;

              // Find the TRUE option (A) split point (not inside math functions like trace(A) or f(A))
              let splitIndexA = -1;
              const aCandidates = Array.from(block.matchAll(/(?:^|\n|\s{2,}|\t)\s*\(A\)/g));
              for (const c of aCandidates) {
                const idx = c.index! + c[0].indexOf('(A)');
                const after = block.substring(idx);
                if (/(?:^|\n|\s{2,}|\t)\s*\(B\)/.test(after) && /(?:^|\n|\s{2,}|\t)\s*\(C\)/.test(after) && /(?:^|\n|\s{2,}|\t)\s*\(D\)/.test(after)) {
                  splitIndexA = idx;
                  break;
                }
              }
              if (splitIndexA === -1) {
                splitIndexA = block.indexOf('(A)');
              }
              const rawQuestionText = block.substring(0, splitIndexA);
              const questionText = rawQuestionText.replace(layoutTagRegex, '').trimEnd();
              const optionsText = block.substring(splitIndexA);

              const matchA = optionsText.match(optARegex);
              const matchB = optionsText.match(optBRegex);
              const matchC = optionsText.match(optCRegex);
              const matchD = optionsText.match(optDRegex);

              const balanceOptionDollars = (s: string) => {
                if (!s) return s;
                let trimmed = s.trim();
                if (!trimmed) return trimmed;
                const dollars = (trimmed.match(/(?<!\\)\$/g) || []).length;
                if (dollars % 2 !== 0) {
                  trimmed = trimmed + '$';
                } else if (dollars === 0) {
                  if (/\\(?:frac|sqrt|Delta|pm|times|alpha|beta|theta|pi|le|ge|neq|ne|approx|infty|vec|hat|left|right|dots|ldots|cdots|ln|log|sin|cos|tan)\b/.test(trimmed)) {
                    trimmed = `$${trimmed}$`;
                  }
                }
                return trimmed;
              };

              const optA = balanceOptionDollars(matchA ? matchA[1].replace(layoutTagRegex, '').trim() : '');
              const optB = balanceOptionDollars(matchB ? matchB[1].replace(layoutTagRegex, '').trim() : '');
              const optC = balanceOptionDollars(matchC ? matchC[1].replace(layoutTagRegex, '').trim() : '');
              const optD = balanceOptionDollars(matchD ? matchD[1].replace(layoutTagRegex, '').trim() : '');
              const estimateVisualLength = (text: string): number => {
                if (!text) return 0;
                let s = text.trim();
                s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, '');
                s = s.replace(/\\(?:mathbb|mathbf|mathrm|text|displaystyle|textstyle|limits|nolimits|left|right)\b/g, '');
                s = s.replace(/[\^_]\{([^{}]+)\}/g, '$1');
                s = s.replace(/[\^_]([a-zA-Z0-9])/g, '$1');

                const fracRegex = /\\d?frac\{([^{}]+)\}\{([^{}]+)\}/;
                let iterations = 0;
                while (fracRegex.test(s) && iterations < 5) {
                  s = s.replace(fracRegex, (_, num, den) => {
                    const lenN = estimateVisualLength(num);
                    const lenD = estimateVisualLength(den);
                    return 'X'.repeat(Math.max(lenN, lenD));
                  });
                  iterations++;
                }

                s = s.replace(/\\sqrt\{([^{}]+)\}/g, 'X$1');
                s = s.replace(/\\[a-zA-Z]+/g, 'X');
                s = s.replace(/[{}]/g, '');
                s = s.replace(/([+\-=])/g, ' $1 ');

                return s.replace(/\s+/g, ' ').trim().length;
              };

              const maxLen = Math.max(
                estimateVisualLength(optA),
                estimateVisualLength(optB),
                estimateVisualLength(optC),
                estimateVisualLength(optD)
              );

              // Check if options contain tall/bulky math notation that requires extra vertical space (fractions, roots, matrices)
              const allOptsCombined = optA + optB + optC + optD;
              const hasTallMath = /(\\frac|\\dfrac|\\sqrt|\\int|\\sum|\\prod|\\begin\{|\\matrix)/.test(allOptsCombined);

              // Single Column A4 (~325px per option in 2x2) cleanly holds ~44 chars at medium (11pt) without wrapping
              const singleLineLimit = isDoubleColumn
                ? 3
                : hasTallMath
                ? 4
                : fontSize === 'small'
                ? 10
                : fontSize === 'large'
                ? 7
                : fontSize === 'xlarge'
                ? 6
                : 8;
              const twoByTwoLimit = isDoubleColumn
                ? fontSize === 'small'
                  ? 18
                  : 15
                : hasTallMath
                ? fontSize === 'large' || fontSize === 'xlarge'
                  ? 20
                  : 24
                : fontSize === 'small'
                ? 48
                : fontSize === 'large'
                ? 38
                : fontSize === 'xlarge'
                ? 32
                : 44;

              let optionsLayout = '';
              if (forcedLayout === '1x4') {
                optionsLayout = 'grid grid-cols-4 w-auto gap-x-4 gap-y-1';
              } else if (forcedLayout === '2x2') {
                optionsLayout = 'grid grid-cols-2 w-auto gap-x-6 gap-y-1';
              } else if (forcedLayout === '1x1') {
                optionsLayout = 'flex flex-col w-auto gap-1';
              } else {
                if (maxLen <= singleLineLimit) {
                  optionsLayout = 'grid grid-cols-4 w-auto gap-x-4 gap-y-1';
                } else if (maxLen <= twoByTwoLimit) {
                  optionsLayout = 'grid grid-cols-2 w-auto gap-x-6 gap-y-1';
                } else {
                  optionsLayout = 'flex flex-col w-auto gap-1';
                }
              }

              const qMatch = questionText.match(/^(\d+|[IVXLCDM]+)\.\s+/i);
              const qNumStr = qMatch ? qMatch[1] : '';
              const qRest = qMatch ? questionText.substring(qMatch[0].length) : questionText;

              return (
                <div className={`question-item break-inside-avoid ${getFontSizeClass()} ${getSpacingClasses()}`}>
                  <div className="question-text-wrapper mb-0.5 flex items-baseline whitespace-pre-wrap">
                    {qNumStr ? (
                      <strong className="flex-shrink-0 w-8 md:w-9 text-left font-bold">{qNumStr}.</strong>
                    ) : (
                      <div className="flex-shrink-0 w-8 md:w-9"></div>
                    )}
                    <div className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(qRest) }} />
                  </div>
                  <div className={`question-options-container ml-8 md:ml-9 pr-2 ${optionsLayout}`}>
                    <div className="question-option-item flex items-start min-w-0 whitespace-pre-wrap"><span className="mr-1.5 font-medium flex-shrink-0">(A)</span> <span className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(optA) }} /></div>
                    <div className="question-option-item flex items-start min-w-0 whitespace-pre-wrap"><span className="mr-1.5 font-medium flex-shrink-0">(B)</span> <span className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(optB) }} /></div>
                    <div className="question-option-item flex items-start min-w-0 whitespace-pre-wrap"><span className="mr-1.5 font-medium flex-shrink-0">(C)</span> <span className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(optC) }} /></div>
                    <div className="question-option-item flex items-start min-w-0 whitespace-pre-wrap"><span className="mr-1.5 font-medium flex-shrink-0">(D)</span> <span className="flex-1 min-w-0 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderLatex(optD) }} /></div>
                  </div>
                </div>
              );
            })()
          )}
        </React.Fragment>
      );

      elements.push(
        <div key={`${subject}-block-${i}`} data-mcq-block="true" className="question-block w-full break-inside-avoid" style={{ marginBottom }}>
          {blockContent}
        </div>
      );
    }
  };

  const parseBlocks = () => {
    const elements: JSX.Element[] = [];

    if (sections && sections.length > 0) {
      sections.forEach((section, index) => {
        elements.push(
          <div key={`section-header-${section.id}`} data-mcq-block="true" className="section-header w-full my-4 break-inside-avoid text-center">
            <h3 className="font-bold text-[12pt] uppercase">{section.name}</h3>
            {section.instructions && (
              <div className="text-left mt-2 flex justify-between items-start text-[10pt] font-medium leading-snug">
                <div className="flex-1 mr-4 whitespace-pre-wrap">{section.instructions}</div>
                {section.marksPerQuestion && section.totalQuestions && (
                  <div className="flex-shrink-0 whitespace-nowrap">
                    {section.totalQuestions} x {section.marksPerQuestion} = {Number(section.totalQuestions) * Number(section.marksPerQuestion)} Marks
                  </div>
                )}
              </div>
            )}
          </div>
        );
        parseTextToBlocks(section.content, `section-${section.id}`, elements);
      });
    } else if (selectedSubjects && selectedSubjects.length > 0 && subjectContents) {
      selectedSubjects.forEach(subject => {
        let subjectText = subjectContents[subject];
        if (!subjectText || subjectText.trim() === '') {
          // Synonym fallback between 'Maths' and 'Mathematics'
          if (subject === 'Maths' && subjectContents['Mathematics']) subjectText = subjectContents['Mathematics'];
          else if (subject === 'Mathematics' && subjectContents['Maths']) subjectText = subjectContents['Maths'];
        }
        if (!subjectText || subjectText.trim() === '') return;

        if (showSubjectHeadings) {
          elements.push(
            <div key={`heading-${subject}`} data-mcq-block="true" className="section-header w-full mt-4 mb-2 break-inside-avoid text-center">
              <h3 className="font-bold text-[12pt] uppercase border-b-2 border-black inline-block px-4 pb-1">
                {subject}
              </h3>
            </div>
          );
        }

        if (parseMode === 'raw') {
          elements.push(
            <div key={`raw-content-${subject}`} className="w-full whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderLatex(subjectText) }} />
          );
        } else {
          parseTextToBlocks(subjectText, subject, elements);
        }
      });
    } else if (content) {
      if (parseMode === 'raw') {
        elements.push(
          <div key="raw-content" className="w-full whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: renderLatex(content) }} />
        );
      } else {
        parseTextToBlocks(content, 'single-content', elements);
      }
    }

    return elements;
  };

  return (
    <div
      className="bg-white text-black shadow-2xl print:shadow-none mx-auto relative w-[210mm] min-h-[297mm] print:min-h-0 print:m-0"
      style={{ boxSizing: 'border-box', fontFamily: "'TeX Gyre Schola', 'TeXGyreSchola', serif, 'Mandali'" }}
      id="a4-preview-paper"
    >
      {showPageBorder && (() => {
        const bp = pageBorderPadding === 'small' ? '4mm' : pageBorderPadding === 'medium' ? '8mm' : pageBorderPadding === 'large' ? '12mm' : '0mm';
        return (
          <div
            className="page-border absolute pointer-events-none z-50 border-black"
            style={{
              ['--bp' as any]: bp,
              inset: bp,
              borderWidth: pageBorderThickness === 'thin' ? '1px' : pageBorderThickness === 'medium' ? '2px' : '4px',
              borderStyle: pageBorderStyle || 'solid',
            }}
          />
        );
      })()}
      <style>{`
        .katex-display {
          overflow-x: visible !important;
          overflow-y: visible !important;
          max-width: 100%;
          margin: 0.3em 0 !important;
        }
        .katex {
          font-size: 1.02em !important;
        }
        .katex .hide-tail {
          overflow: hidden !important;
        }
        .katex svg {
          overflow: hidden !important;
        }
        .katex-error {
          color: inherit !important;
          border-bottom: 1px dotted #999;
          font-family: inherit !important;
        }
        @page { size: A4; margin: 10mm 0; }

        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          #a4-preview-paper {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .katex .hide-tail { overflow: hidden !important; }
          .katex svg { overflow: hidden !important; }
          .katex-display { overflow: visible !important; }
          .katex, .katex * { visibility: visible !important; color: #000 !important; }
          .katex-error { color: #000 !important; border-bottom: none !important; font-family: inherit !important; }

          .question-block { break-inside: avoid !important; page-break-inside: avoid !important; }
          .question-text-wrapper { break-after: avoid !important; page-break-after: avoid !important; }
          .question-options-container { break-before: avoid !important; page-break-before: avoid !important; }
          .question-option-item { break-inside: avoid !important; overflow-wrap: break-word; }
          .paper-header, .section-header, .paper-instructions { break-inside: avoid !important; }

          .mcq-double-column {
            column-count: 2 !important;
            column-gap: 20px !important;
            column-rule: 1.2px solid #000000 !important;
            column-fill: auto !important;
            min-height: 0 !important;
          }

          /* border prathi page lo */
          .page-border {
            position: fixed !important;
            top: 0 !important; bottom: 0 !important;
            left: var(--bp) !important; right: var(--bp) !important;
          }
        }

        .mcq-double-column {
          column-count: 2 !important;
          column-gap: 22px !important;
          column-rule: 1.2px solid #000000 !important;
          column-fill: auto !important;
          min-height: 195mm;
        }
      `}</style>
      <div className="pt-3 pb-3 px-[8mm] lining-nums tabular-nums">

        {/* Header Section */}
        {showHeader && (
          <div data-mcq-block="true" className="paper-header mb-2 border-b-2 border-black pb-1.5 break-inside-avoid">
            <div className="grid grid-cols-[80px_1fr_80px] items-center">
              <div>
                <img
                  src={logoBase64 || '/logo.png'}
                  alt="Logo"
                  className="w-[78px] h-[78px] object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-[1.55rem] font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap">SRI VENKATESWARA JY SCHOOL</h1>
                <h2 className="text-sm font-semibold mb-0.5">(IIT-JEE/NEET Foundation – Olympiads)</h2>
                <p className="text-xs">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
              </div>
              <div />
            </div>

            <div className="text-center mt-1 mb-1">
              <h3 className="text-base font-bold uppercase">{examName || 'EXAMINATION'}</h3>
            </div>

            <div className="flex flex-col text-[10.5pt] font-medium px-1 gap-0.5">
              <div className="flex justify-between items-center">
                <div><span className="font-bold">Class:</span> {examClass || examSubject || '_______________'}</div>
                {(() => {
                  const subjectText = hideHeaderSubjectIfEmpty
                    ? (realSubject || '').trim()
                    : (realSubject || (selectedSubjects?.length === 1 ? selectedSubjects[0] : (selectedSubjects && selectedSubjects.length > 1 ? selectedSubjects.join(', ') : '')) || examSubject || '_______________');
                  return subjectText ? (
                    <div><span className="font-bold">Subject:</span> {subjectText}</div>
                  ) : null;
                })()}
                <div><span className="font-bold">Marks:</span> {maxMarks || '100'}</div>
              </div>
              <div className="flex justify-between items-center">
                <div><span className="font-bold">Date:</span> {examDate || '___/___/20__'}</div>
                {time && <div><span className="font-bold">Time:</span> {time}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Instructions Section */}
        {showHeader && instructions.length > 0 && (
          <div data-mcq-block="true" className="paper-instructions mb-3 text-[10pt] leading-snug break-inside-avoid border-b border-black pb-2">
            <h3 className="font-bold mb-1 uppercase underline underline-offset-2">General Instructions:</h3>
            <ul className="list-disc pl-5 m-0 space-y-0.5">
              {instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions Section - Support Double Column */}
        <div className={isDoubleColumn ? "mcq-double-column" : ""}>
          {parseBlocks()}
        </div>

      </div>

      {/* Floating Images Layer (For free-floating draggable images on paper) */}
      {Object.entries(inlineImages).map(([id, imgData]) => {
        if (typeof imgData === 'string') return null;

        const dataUrl = imgData.dataUrl;
        const x = imgData.x;
        const y = imgData.y;
        const width = imgData.width;
        const height = imgData.height;

        return (
          <Rnd
            key={id}
            position={{ x, y }}
            size={{ width, height }}
            onDragStop={(e, d) => onImageUpdate?.(id, { x: d.x, y: d.y })}
            onResizeStop={(e, direction, ref, delta, position) => {
              onImageUpdate?.(id, {
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height),
                ...position
              });
            }}
            bounds="parent"
            cancel=".delete-btn"
            className="group absolute z-50 cursor-move"
            style={{}}
          >
            <div className="relative w-full h-full bg-white/50 backdrop-blur-[1px] hover:bg-transparent transition-all border border-blue-400 group-hover:border-blue-600 border-dashed print:border-none print:bg-transparent !print:border-none shadow-sm">
              <img src={(dataUrl && !dataUrl.startsWith('data:') && !dataUrl.startsWith('http') ? getPhotoUrl(dataUrl) : dataUrl) || dataUrl} className="w-full h-full object-contain pointer-events-none print:max-w-full" />
              {onImageDelete && (
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onImageDelete(id); }}
                  className="delete-btn absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity print:hidden shadow-md cursor-pointer z-[100]"
                  title="Remove Image"
                >
                  ×
                </button>
              )}
            </div>
          </Rnd>
        );
      })}

    </div>
  );
};