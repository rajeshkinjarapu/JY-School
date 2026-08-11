import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

import { Rnd } from 'react-rnd';

export interface FloatingImage {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LiveLatexPreviewProps {
  subjectContents: Record<string, string>;
  examName: string;
  maxMarks: string;
  time: string;
  instructions: string[];
  examDate?: string;
  examSubject?: string;
  selectedSubjects?: string[];
  logoBase64?: string;
  isDoubleColumn?: boolean;
  inlineImages?: Record<string, FloatingImage | string>;
  onImageUpdate?: (id: string, updates: Partial<FloatingImage>) => void;
  onImageDelete?: (id: string) => void;
}

export const LiveLatexPreview: React.FC<LiveLatexPreviewProps> = ({
  subjectContents,
  examName,
  maxMarks,
  time,
  instructions,
  examDate = '',
  examSubject = '',
  selectedSubjects = [],
  logoBase64 = '',
  isDoubleColumn = false,
  inlineImages = {},
  onImageUpdate,
  onImageDelete
}) => {
  // Helper to balance braces in math strings so KaTeX doesn't crash on bad AI output
  const balanceMath = (math: string) => {
    let m = math.trim();
    if (m.endsWith('\\')) m = m.slice(0, -1);
    
    let unescapedOpen = 0, unescapedClose = 0;
    let escapedOpen = 0, escapedClose = 0;
    
    for (let i = 0; i < m.length; i++) {
       if (m[i] === '\\') {
          if (m[i+1] === '{') escapedOpen++;
          else if (m[i+1] === '}') escapedClose++;
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

  const renderLatex = (text: string) => {
    try {
      // Fix AI often outputting \\) instead of \)
      let fixedText = text.replace(/\\\\\)/g, '\\)');
      fixedText = fixedText.replace(/\\\\\(/g, '\\(');
      fixedText = fixedText.replace(/\\\\\]/g, '\\]');
      fixedText = fixedText.replace(/\\\\\[/g, '\\[');

      // We removed the [IMG:id] replacement because images are now floating
      let withImages = fixedText.replace(/\[IMG:([a-z0-9]+)\]/g, '');

      let normalized = withImages.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
      normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
      
      const parts = normalized.split(/(\$\$[\s\S]*?\$\$)/g);
      return parts.map(part => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = balanceMath(part.slice(2, -2));
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        }
        
        const inlineParts = part.split(/(\$[\s\S]*?\$)/g);
        return inlineParts.map(inlinePart => {
          if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
            const math = balanceMath(inlinePart.slice(1, -1));
            return katex.renderToString(math, { displayMode: false, throwOnError: false });
          }
          return inlinePart.replace(/\n/g, '<br/>');
        }).join('');
      }).join('');
    } catch (e) {
      console.error("KaTeX Error", e);
      return text.replace(/\n/g, '<br/>');
    }
  };

  const parseBlocks = () => {
    const elements: JSX.Element[] = [];
    
    selectedSubjects.forEach(subject => {
      const subjectText = subjectContents[subject];
      if (!subjectText || subjectText.trim() === '') return;
      
      const rawBlocks = subjectText.split(/(\n\n+)/);
      
      // Add subject heading
      elements.push(
        <div id={`preview-subject-${subject}`} key={`heading-${subject}`} className="w-full text-center my-3 break-before-auto">
          <h3 className="font-bold text-[13pt] underline underline-offset-4 uppercase">{subject}</h3>
        </div>
      );
      
      for (let i = 0; i < rawBlocks.length; i += 2) {
        const block = rawBlocks[i];
        if (block.trim() === '') continue; // Skip pure whitespace blocks
        
        const separator = i + 1 < rawBlocks.length ? rawBlocks[i + 1] : '';
        const extraNewlines = Math.max(0, (separator.match(/\n/g) || []).length - 2);
        const marginBottom = extraNewlines > 0 ? `calc(0.4rem + ${extraNewlines * 3}rem)` : '0.4rem';

        const hasOptions = block.includes('(A)') && block.includes('(B)') && block.includes('(C)') && block.includes('(D)');

        const blockContent = (
          <React.Fragment key={`${subject}-${i}`}>
          {!hasOptions ? (
            (() => {
              const qNumMatch2 = block.match(/^(\d+)\.\s*/);
              if (qNumMatch2) {
                const num = qNumMatch2[1];
                const restText = block.substring(qNumMatch2[0].length);
                return (
                  <div className="mb-2 break-inside-avoid text-[11pt] flex whitespace-pre-wrap" style={{ gap: '0.4em' }}>
                    <strong className="flex-shrink-0">{num}.</strong>
                    <div dangerouslySetInnerHTML={{ __html: renderLatex(restText) }} />
                  </div>
                );
              }
              return (
                <div 
                  className="mb-2 break-inside-avoid text-[11pt]"
                  dangerouslySetInnerHTML={{ __html: renderLatex(block) }} 
                />
              );
            })()
          ) : (
            (() => {
              const optARegex = /\(A\)\s*(.*?)(?=\(B\)|$)/s;
              const optBRegex = /\(B\)\s*(.*?)(?=\(C\)|$)/s;
              const optCRegex = /\(C\)\s*(.*?)(?=\(D\)|$)/s;
              const optDRegex = /\(D\)\s*(.*)/s;

              const splitIndexA = block.indexOf('(A)');
              const questionText = block.substring(0, splitIndexA).trim();
              const optionsText = block.substring(splitIndexA);

              const matchA = optionsText.match(optARegex);
              const matchB = optionsText.match(optBRegex);
              const matchC = optionsText.match(optCRegex);
              const matchD = optionsText.match(optDRegex);

              const optA = matchA ? matchA[1].trim() : '';
              const optB = matchB ? matchB[1].trim() : '';
              const optC = matchC ? matchC[1].trim() : '';
              const optD = matchD ? matchD[1].trim() : '';
              const estimateVisualLength = (text: string) => {
                return text.replace(/\$|\\[a-zA-Z]+|{|}|_|\\/g, '').trim().length;
              };

              const maxLen = Math.max(
                estimateVisualLength(optA), 
                estimateVisualLength(optB), 
                estimateVisualLength(optC), 
                estimateVisualLength(optD)
              );
              
              let optionsLayout = '';
              if (maxLen < 15) {
                optionsLayout = 'grid grid-cols-4 w-full gap-x-2 gap-y-0.5';
              } else if (maxLen < 80) {
                optionsLayout = 'grid grid-cols-2 w-full gap-x-2 gap-y-0.5';
              } else {
                optionsLayout = 'flex flex-col w-full gap-0.5';
              }

              // Extract question number for hanging indent
              const qMatch = questionText.match(/^(\d+)\.\s*/);
              const qNum = qMatch ? qMatch[1] : '';
              const qRest = qMatch ? questionText.substring(qMatch[0].length) : questionText;

              return (
                <div className="mb-1 break-inside-avoid text-[11pt] leading-snug">
                  <div className="mb-0.5 flex whitespace-pre-wrap" style={{ gap: '0.4em' }}>
                    <strong className="flex-shrink-0">{qNum}.</strong>
                    <div dangerouslySetInnerHTML={{ __html: renderLatex(qRest) }} />
                  </div>
                  <div className={`ml-6 pr-4 ${optionsLayout}`}>
                    <div className="flex"><span className="mr-1.5 font-medium">(A)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optA) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(B)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optB) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(C)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optC) }} /></div>
                    <div className="flex"><span className="mr-1.5 font-medium">(D)</span> <span dangerouslySetInnerHTML={{ __html: renderLatex(optD) }} /></div>
                  </div>
                </div>
              );
            })()
          )}
          </React.Fragment>
        );

        elements.push(
          <div key={`${subject}-block-${i}`} className="w-full relative group" style={{ marginBottom }}>
            {blockContent}
          </div>
        );
      }
    });
    
    return elements;
  };

  return (
    <div 
      className="bg-white text-black print:bg-white print:m-0 shadow-2xl print:shadow-none mx-auto border border-gray-300 print:border-none relative" 
      style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', fontFamily: "'TeX Gyre Schola', 'TeXGyreSchola', serif, 'Mandali'" }}
      id="a4-preview-paper"
    >
      <style>{`
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          max-width: 100%;
          margin: 0.5em 0 !important;
        }
        .katex {
          white-space: normal !important;
          word-break: break-word;
        }
        .katex-html {
          display: inline-flex !important;
          flex-wrap: wrap;
        }
      `}</style>
      <div className="pt-0 pb-6 px-10 lining-nums tabular-nums">
        
        {/* Header Section */}
        <div className="mb-3 border-b-2 border-black pb-2">
          <div className="flex items-center justify-center relative mb-2">
            <img 
              src={logoBase64 || '/logo.png'} 
              alt="Logo" 
              className="absolute left-0 mt-2 w-24 h-24 object-contain"
            />
            <div className="text-center mt-1">
              <h1 className="text-[1.65rem] font-bold uppercase tracking-wider mb-1 whitespace-nowrap">SRI VENKATESWARA JY SCHOOL</h1>
              <h2 className="text-sm font-semibold mb-1">(IIT-JEE/NEET Foundation – Olympiads)</h2>
              <p className="text-xs">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</p>
            </div>
          </div>
          
          <div className="text-center mt-2 mb-2">
             <h3 className="text-lg font-bold uppercase">{examName || 'EXAMINATION'}</h3>
          </div>
          
          <div className="flex flex-col text-[11pt] font-medium mt-2 px-1 gap-1">
            <div className="flex justify-between items-center">
              <div><span className="font-bold">Class:</span> {examSubject || '_______________'}</div>
              <div><span className="font-bold">Marks:</span> {time || '75'}</div>
            </div>
            <div className="flex justify-between items-center">
              <div><span className="font-bold">Date:</span> {examDate || '___/___/20__'}</div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        {instructions.length > 0 && (
          <div className="mb-3 text-[10pt] leading-snug break-inside-avoid">
            <h3 className="font-bold mb-1 uppercase underline underline-offset-2">General Instructions:</h3>
            <ul className="list-disc pl-5 m-0 space-y-0.5">
              {instructions.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Questions Section - Support Double Column */}
        <div className={isDoubleColumn ? "columns-2 gap-6" : ""}>
          {parseBlocks()}
        </div>

      </div>

      {/* Floating Images Layer */}
      {Object.entries(inlineImages).map(([id, imgData]) => {
        // Handle migration from old string format
        const isString = typeof imgData === 'string';
        const dataUrl = isString ? imgData : (imgData as FloatingImage).dataUrl;
        const x = isString ? 50 : (imgData as FloatingImage).x;
        const y = isString ? 50 : (imgData as FloatingImage).y;
        const width = isString ? 200 : (imgData as FloatingImage).width;
        const height = isString ? 200 : (imgData as FloatingImage).height;

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
            className="group absolute z-50"
            style={{}}
          >
            <div className="relative w-full h-full bg-white/50 backdrop-blur-[1px] hover:bg-transparent transition-all border border-transparent group-hover:border-blue-400 border-dashed print:border-none print:bg-transparent">
              <img src={dataUrl} className="w-full h-full object-contain pointer-events-none" />
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
