interface Question {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  type: string;
  difficulty: string;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  solution: string;
  marks: number;
  negativeMarks: number;
  tags?: string;
}

interface Section {
  name: string;
  type: string;
  questions: Question[];
}

interface Paper {
  title: string;
  duration: number;
  totalMarks: number;
  instructions: string;
  examDate?: string | null;
  paperCode?: string | null;
  sections: Section[];
}

// Cleans HTML/Markdown-style mathematical markers (like $...$ or $$...$$) 
// and returns LaTeX strings. 
const cleanMathNotation = (text: string): string => {
  if (!text) return '';
  
  // Replace standard escape sequences if any
  return text
    .replace(/\\&/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n');
};

export const exportToLatex = (paper: Paper): string => {
  let tex = `\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{multicol}
\\usepackage{fancyhdr}
\\usepackage{tcolorbox}
\\usepackage{enumitem}
\\usepackage{graphicx}

% Header/Footer configuration
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\textbf{${paper.title}}}
\\fancyhead[R]{\\textbf{${paper.paperCode || 'JEE MAINS PATTERN'}}}
\\fancyfoot[C]{\\thepage}
\\renewcommand{\\headrulewidth}{0.5pt}

\\begin{document}

% Title / Header Box
\\begin{tcolorbox}[colback=white,colframe=black,arc=0mm,outer arc=0mm,boxrule=1.2pt]
\\begin{center}
  {\\LARGE \\textbf{${paper.title}}} \\\\[0.2cm]
  {\\large \\textbf{JEE MAINS PRACTICE QUESTION PAPER}} \\\\[0.1cm]
  ${paper.examDate ? `\\textbf{Date: ${paper.examDate}} \\quad | \\quad` : ''} 
  \\textbf{Duration: ${paper.duration} Minutes} \\quad | \\quad 
  \\textbf{Total Marks: ${paper.totalMarks}}
\\end{center}
\\end{tcolorbox}

\\vspace{0.2cm}
\\noindent\\textbf{INSTRUCTIONS:}
\\begin{itemize}[noitemsep,topsep=0pt]
${paper.instructions
  .split('\n')
  .filter((i) => i.trim() !== '')
  .map((i) => `  \\item ${cleanMathNotation(i.trim())}`)
  .join('\n')}
\\end{itemize}

\\hrulefill
\\vspace{0.4cm}

`;

  // Process Each Section
  paper.sections.forEach((sec) => {
    tex += `\\section*{${sec.name}}\n`;
    tex += `\\addcontentsline{toc}{section}{${sec.name}}\n`;
    tex += `\\begin{multicols*}{2}\n`;
    tex += `\\setlist[enumerate]{leftmargin=*}\n`;
    tex += `\\begin{enumerate}\n`;

    sec.questions.forEach((q) => {
      const qText = cleanMathNotation(q.questionText);
      tex += `  \\item ${qText}\n`;

      if (q.type.startsWith('MCQ') && q.optionA) {
        tex += `  \\begin{enumerate}[label=(\\Alph*),noitemsep]\n`;
        tex += `    \\item ${cleanMathNotation(q.optionA)}\n`;
        tex += `    \\item ${cleanMathNotation(q.optionB || '')}\n`;
        tex += `    \\item ${cleanMathNotation(q.optionC || '')}\n`;
        tex += `    \\item ${cleanMathNotation(q.optionD || '')}\n`;
        tex += `  \\end{enumerate}\n`;
      } else if (q.type === 'NUMERICAL') {
        tex += `  \\textit{[Numerical Answer Type - Integer or Decimal decimal value]}\n`;
      }
      tex += `  \\vspace{0.2cm}\n`;
    });

    tex += `\\end{enumerate}\n`;
    tex += `\\end{multicols*}\n`;
    tex += `\\newpage\n\n`;
  });

  // Answer Key Page
  tex += `% ==================== ANSWER KEY ====================\n`;
  tex += `\\section*{Answer Key}\n`;
  tex += `\\hrulefill\n\\vspace{0.5cm}\n`;
  tex += `\\begin{table}[h]\n`;
  tex += `\\centering\n`;
  tex += `\\begin{tabular}{|c|c|c|p{8cm}|}\n`;
  tex += `\\hline\n`;
  tex += `\\textbf{Sec} & \\textbf{Q.No} & \\textbf{Correct Answer} & \\textbf{Subject / Chapter} \\\\\n`;
  tex += `\\hline\n`;

  let absoluteQNo = 1;
  paper.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      tex += ` ${sec.name.split(' ')[0]} & ${absoluteQNo} & \\textbf{${q.correctAnswer}} & ${q.subject} - ${q.chapter} \\\\\n`;
      tex += `\\hline\n`;
      absoluteQNo++;
    });
  });

  tex += `\\end{tabular}\n`;
  tex += `\\end{table}\n`;
  tex += `\\newpage\n\n`;

  // Solutions Page
  tex += `% ==================== DETAILED SOLUTIONS ====================\n`;
  tex += `\\section*{Detailed Solutions}\n`;
  tex += `\\hrulefill\n\\vspace{0.5cm}\n`;
  
  absoluteQNo = 1;
  paper.sections.forEach((sec) => {
    tex += `\\subsection*{${sec.name} Solutions}\n`;
    sec.questions.forEach((q) => {
      tex += `\\noindent\\textbf{Question ${absoluteQNo}:} (${q.subject} - ${q.chapter})\n`;
      tex += `\\\\ ${cleanMathNotation(q.questionText)}\n`;
      if (q.type.startsWith('MCQ')) {
        tex += `\\\\ Correct Option: \\textbf{${q.correctAnswer}}\n`;
      } else {
        tex += `\\\\ Correct Answer: \\textbf{${q.correctAnswer}}\n`;
      }
      tex += `\\\\ \\textbf{Solution:}\n`;
      tex += `\\\\ ${cleanMathNotation(q.solution)}\n`;
      tex += `\\\\ \\hrulefill \\vspace{0.4cm}\n\n`;
      absoluteQNo++;
    });
  });

  tex += `\\end{document}`;
  return tex;
};
export const downloadTexFile = (paper: Paper) => {
  const code = exportToLatex(paper);
  const element = document.createElement("a");
  const file = new Blob([code], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = `${paper.title.replace(/\s+/g, "_").toLowerCase()}_source.tex`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
