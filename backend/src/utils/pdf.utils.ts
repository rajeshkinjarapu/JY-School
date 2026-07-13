import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (htmlContent: string): Promise<Buffer> => {
  // Launch Puppeteer headless browser
  // Include args to ensure it runs correctly on Windows and standard environments
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for print-ready display
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 }); // Standard A4 ratio at 96 DPI

    // Set page content
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>JEE mains Exam Paper</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,700;1,400&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              color: #000000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .paper-serif {
              font-family: 'Lora', 'Georgia', serif;
            }

            /* Custom styling rules matching index.css */
            .jee-header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .jee-header-table th, .jee-header-table td {
              border: 1px solid #000000;
              padding: 8px;
              text-align: center;
            }
            
            .two-column-layout {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 24px;
              column-rule: 1px solid #e2e8f0;
              position: relative;
            }

            /* Add vertical dividing line for two columns */
            .two-column-layout::after {
              content: "";
              position: absolute;
              top: 0;
              bottom: 0;
              left: 50%;
              border-left: 1px solid #000000;
              transform: translateX(-50%);
            }

            .question-block {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 1px dashed #d1d5db;
            }

            .question-options-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              margin-top: 8px;
            }

            .question-option {
              display: flex;
              align-items: flex-start;
            }

            .option-letter {
              font-weight: 600;
              margin-right: 6px;
            }

            .page-break {
              page-break-before: always;
              break-before: page;
            }

            .watermark-container {
              position: relative;
            }

            .watermark-text {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 5rem;
              color: rgba(220, 220, 220, 0.25);
              font-weight: 800;
              pointer-events: none;
              z-index: -10;
              user-select: none;
              text-transform: uppercase;
              text-align: center;
              width: 100%;
            }

            .omr-bubble {
              width: 16px;
              height: 16px;
              border: 1.5px solid #000000;
              border-radius: 50%;
              display: inline-block;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              line-height: 15px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any });

    // Generate A4 PDF with standard margins
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
};
