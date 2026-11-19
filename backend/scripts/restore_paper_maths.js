const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const MATHS_QUESTIONS = `1. Sum of the first $n$ terms of the series $\\frac{1}{2} + \\frac{3}{4} + \\frac{7}{8} + \\frac{15}{16} + \\dots$ is equal to
(A) $2^n - n - 1$
(B) $1 - 2^{-n}$
(C) $n + 2^{-n} - 1$
(D) $2^n + 1$

2. If $\\ln(a+c), \\ln(a-c), \\ln(a - 2b + c)$ are in A.P., then
(A) $a, b, c$ are in A.P
(B) $a^2, b^2, c^2$ are in A.P
(C) $a, b, c$ are in G.P
(D) $a, b, c$ are in H.P.

3. Let $a_1, a_2, a_3, \\dots$ be in harmonic progression with $a_1 = 5$ and $a_{20} = 25$. The least positive integer $n$ for which $a_n < 0$ is
(A) 22
(B) 23
(C) 24
(D) 25

4. Let $V_r$ denote the sum of the first $r$ terms of an arithmetic progression (A.P.) whose first term is $r$ and the common difference is $(2r - 1)$. Let $T_r = V_{r+1} - V_r - 2$ and $Q_r = T_{r+1} - T_r$ for $r = 1, 2, \\dots$. The sum $V_1 + V_2 + \\dots + V_n$ is
(A) $\\frac{1}{12}n(n+1)(3n^2 - n + 1)$
(B) $\\frac{1}{12}n(n+1)(3n^2 + n + 2)$
(C) $\\frac{1}{2}n(2n^2 - n + 1)$
(D) $\\frac{1}{2}(2n^3 - 2n + 3)$

5. In the quadratic equation $ax^2 + bx + c = 0$, $\\Delta = b^2 - 4ac$ and $\\alpha + \\beta, \\alpha^2 + \\beta^2, \\alpha^3 + \\beta^3$ are in G.P., where $\\alpha, \\beta$ are the roots of $ax^2 + bx + c = 0$, then
(A) $\\Delta \\neq 0$
(B) $b\\Delta - 0$
(C) $c\\Delta - 0$
(D) $\\Delta - 0$

6. Let $\\alpha, \\beta$ be the roots of $x^2 - x + p = 0$ and $\\gamma, \\delta$ be the roots of $x^2 - 4x + q = 0$. If $\\alpha, \\beta, \\gamma, \\delta$ are in G.P., then the integral values of $p$ and $q$ respectively, are
(A) $-2, -32$
(B) $-2, 3$
(C) $-6, 3$
(D) $-6, -32$

7. If the sum of the first $2n$ terms of the A.P. $2, 5, 8, \\dots$ is equal to the sum of the first $n$ terms of the A.P. $57, 59, 61, \\dots$, then $n$ equals
(A) 10
(B) 12
(C) 11
(D) 13

8. Let $l_1, l_2, \\dots, l_{100}$ be consecutive terms of an arithmetic progression with common difference $d_1$, and let $w_1, w_2, \\dots, w_{100}$ be consecutive terms of another arithmetic progression with common difference $d_2$, where $d_1 d_2 = 10$. For each $i = 1, 2, \\dots, 100$, let $R_i$ be a rectangle with length $l_i$ and width $w_i$. If $A_{100} - A_1 = 1000$, where $A_i$ is the area of $R_i$, then $d_1$ equals
(A) 1
(B) 2
(C) 3
(D) 4

9. The sum of the first 20 terms of the series $1 + \\frac{3}{2} + \\frac{7}{4} + \\frac{15}{8} + \\dots$ is
(A) $38 + 2^{-19}$
(B) $39 + 2^{-19}$
(C) $40 - 2^{-19}$
(D) $39 - 2^{-19}$

10. If the sum of the roots of the equation $ax^2 + bx + c = 0$ is equal to the sum of the squares of their reciprocals, then $\\frac{a}{c}, \\frac{b}{a}, \\frac{c}{b}$ are in
(A) A.P.
(B) G.P.
(C) H.P.
(D) Arithmetico-Geometric Progression

11. If $a, b, c$ are in G.P. and $x, y$ are the arithmetic means between $a, b$ and $b, c$ respectively, then $\\frac{a}{x} + \\frac{c}{y}$ is equal to
(A) 1
(B) 2
(C) $\\frac{1}{2}$
(D) 4

12. If the sum of the series $(\\frac{1}{2} - \\frac{1}{3}) + (\\frac{1}{2^2} - \\frac{1}{2\\cdot 3} + \\frac{1}{3^2}) + (\\frac{1}{2^3} - \\frac{1}{2^2\\cdot 3} + \\frac{1}{2\\cdot 3^2} - \\frac{1}{3^3}) + \\dots$ is $\\frac{\\alpha}{\\beta}$, where $\\alpha$ and $\\beta$ are co-prime, then $\\alpha + 3\\beta$ is equal to:
(A) 23
(B) 14
(C) 18
(D) 15

13. Two points $A(2, 3)$ and $B(5, 4)$ with another point $C$ form an equilateral triangle. Which of the following can be coordinates of $C$?
(A) $\\left(\\frac{7-\\sqrt{3}}{2}, \\frac{7+3\\sqrt{3}}{2}\\right)$
(B) $\\left(\\frac{7-\\sqrt{3}}{2}, \\frac{7-3\\sqrt{3}}{2}\\right)$
(C) $\\left(\\frac{7+\\sqrt{3}}{2}, \\frac{7+3\\sqrt{3}}{2}\\right)$
(D) $\\left(\\frac{7+\\sqrt{3}}{2}, \\frac{7-3\\sqrt{3}}{2}\\right)$

14. The coordinates of two points $A$ and $B$ are $(3, 4)$ and $(5, -2)$ respectively. If $PA = PB$ and area of $\\Delta PAB$ is $10\\text{ sq. units}$, then the coordinates of $P$ can be:
(A) $(-7, 2)$
(B) $(7, 2)$
(C) $(1, 0)$
(D) $(0, 1)$

15. If $(2, -3), (6, 7), (-5, 4)$ are the vertices of a parallelogram then the remaining vertex can be:
(A) $(13, 0)$
(B) $(-1, 14)$
(C) $(9, -6)$
(D) $(-9, 6)$

16. A line passing through $P(4, 2)$ meets the $x$-axis at $A$ and the $y$-axis at $B$. If $O$ is the origin and the area of $\\Delta OAB$ is minimum, then the slope of the line is
(A) $-\\frac{1}{2}$
(B) $-2$
(C) $-1$
(D) $-\\frac{1}{4}$

17. If the line $2x + y = k$ passes through the point which divides the line segment joining $(1, 1)$ and $(2, 4)$ in the ratio $3 : 2$, then $k$ equals
(A) $\\frac{29}{5}$
(B) 5
(C) 6
(D) $\\frac{11}{5}$

18. The distance between the parallel lines $3x + 4y - 9 = 0$ and $6x + 8y + 15 = 0$ is
(A) $\\frac{33}{10}$
(B) $\\frac{33}{5}$
(C) $\\frac{6}{5}$
(D) $\\frac{3}{10}$

19. The equation of the line passing through $(1, 2)$ and perpendicular to $x + y + 1 = 0$ is
(A) $x - y + 1 = 0$
(B) $x - y - 1 = 0$
(C) $x + y - 3 = 0$
(D) $y - 2 = 0$

20. If $P(1, 2), Q(4, 6), R(5, 7)$ and $S(a, b)$ are the vertices of a parallelogram $PQRS$, then
(A) $a = 2, b = 3$
(B) $a = 3, b = 4$
(C) $a = 2, b = 4$
(D) $a = 3, b = 5$`;

async function main() {
  const paperId = '056bd2a7-89cf-40d4-bbe4-8282837148be';
  console.log(`Checking paper in DB: ${paperId}...`);

  const paper = await prisma.generatedPaper.findUnique({
    where: { id: paperId }
  });

  if (!paper) {
    console.error('Paper not found in DB!');
    return;
  }

  let data = { subjectContents: {}, inlineImages: {}, answerKeys: {}, settings: {} };
  if (paper.content && paper.content.startsWith('<!--MCQ_DATA_V2-->')) {
    data = JSON.parse(paper.content.replace('<!--MCQ_DATA_V2-->\n', ''));
  }

  const existingContents = data.subjectContents || {};
  console.log('Current subjects in DB:', Object.keys(existingContents));

  let physicsContent = existingContents['Physics'] || '';
  let mathsContent = existingContents['Maths'] || existingContents['Mathematics'] || '';

  // Check if Physics questions (26 to 38) were mistakenly placed in Maths
  if (mathsContent.includes('drift velocity') || mathsContent.includes('copper wire') || /^\s*26\.\s/m.test(mathsContent)) {
    console.log('Detected Physics questions placed inside Maths! Moving them to Physics...');
    if (!physicsContent || physicsContent.trim() === '') {
      physicsContent = mathsContent;
    }
    mathsContent = MATHS_QUESTIONS;
  } else if (!mathsContent || mathsContent.trim() === '') {
    console.log('Maths content is empty. Restoring 20 Maths questions...');
    mathsContent = MATHS_QUESTIONS;
  }

  // Ensure both Maths and Physics have their correct questions
  existingContents['Maths'] = mathsContent;
  existingContents['Physics'] = physicsContent;
  if (!existingContents['Chemistry']) {
    existingContents['Chemistry'] = '';
  }

  data.subjectContents = existingContents;
  const newContent = '<!--MCQ_DATA_V2-->\n' + JSON.stringify(data);
  const newSubjectList = 'Maths, Physics, Chemistry';

  await prisma.generatedPaper.update({
    where: { id: paperId },
    data: {
      examSubject: newSubjectList,
      content: newContent
    }
  });

  console.log('✅ SUCCESS! Paper restored with both Maths and Physics questions!');
  console.log('Subjects:', newSubjectList);
  console.log('Maths questions restored: 20');
  console.log('Physics questions count:', (physicsContent.match(/^\s*(?:\d+|Q\d+)[\.\)]/gim) || []).length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
