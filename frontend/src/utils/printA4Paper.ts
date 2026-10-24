/**
 * printA4Paper - Universal, high-fidelity A4 paper printing utility
 * Ensures that whatever is visible in Live Preview matches 100% in Print output:
 * 1. Resolves relative asset and font URLs using <base href="..." />.
 * 2. Copies all stylesheets (<link> and <style>) and active CSS rules from the main document.
 * 3. Transfers all loaded FontFace objects directly from document.fonts into iframe to avoid network latency.
 * 4. Explicitly awaits document.fonts.ready and image loading before print dialog opens.
 * 5. Guarantees KaTeX formula visibility (disables MathML overlap and prevents FOIT - Flash of Invisible Text).
 * 6. Uses afterprint listener for safe cleanup instead of premature removal.
 */
export const printA4Paper = async (
  paperElementId: string = 'a4-preview-paper',
  title: string = 'Question Paper'
): Promise<void> => {
  const paperEl = document.getElementById(paperElementId);
  if (!paperEl) {
    window.print();
    return;
  }

  // 1. Remove any leftover print iframe
  const existingIframe = document.getElementById('print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // 2. Clone the element
  const cloneEl = paperEl.cloneNode(true) as HTMLElement;
  cloneEl.classList.remove('shadow-2xl', 'min-h-[297mm]');
  cloneEl.style.boxShadow = 'none';
  cloneEl.style.border = 'none';
  cloneEl.style.outline = 'none';
  cloneEl.style.margin = '0 auto';
  cloneEl.style.width = '100%';
  cloneEl.style.maxWidth = '210mm';
  cloneEl.style.minHeight = '0';

  // 3. Create invisible printing iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    window.print();
    return;
  }

  // 4. Collect all link stylesheets and style tags from current document
  const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(link => link.outerHTML)
    .join('\n');

  const styleTags = Array.from(document.querySelectorAll('style'))
    .map(style => style.outerHTML)
    .join('\n');

  // Collect rules from same-origin stylesheets to preserve compiled/bundled styles
  let inlineCss = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.cssRules) {
          for (const rule of Array.from(sheet.cssRules)) {
            inlineCss += rule.cssText + '\n';
          }
        }
      } catch {
        // Cross-origin stylesheet rules cannot be read; handled by <link> tags
      }
    }
  } catch {
    // Ignore stylesheet access errors
  }

  // 5. Construct full HTML document for the iframe
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <base href="${window.location.origin}/" />
      <meta name="color-scheme" content="light" />
      <title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
      ${linkTags}
      ${styleTags}
      <style>
        ${inlineCss}
      </style>
      <style>
        :root { color-scheme: light !important; }
        @page {
          size: A4 portrait;
          margin: 0;
        }
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #000000 !important;
          font-family: 'TeX Gyre Schola', 'TeXGyreSchola', serif, 'Mandali' !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }
        #print-root {
          width: 100% !important;
          max-width: 210mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          height: auto !important;
          overflow: visible !important;
        }
        /* KaTeX formula rendering guarantee */
        .katex, .katex * {
          color: #000000 !important;
          visibility: visible !important;
          background: transparent !important;
          background-color: transparent !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .katex {
          white-space: nowrap !important;
        }
        .katex .katex-mathml {
          display: none !important;
        }
        .katex .katex-html {
          display: inline-block !important;
          white-space: nowrap !important;
          visibility: visible !important;
        }
        .katex .base {
          display: inline-block !important;
          white-space: nowrap !important;
          visibility: visible !important;
        }
        .katex .mord, .katex .mop, .katex .mbin, .katex .mrel, .katex .mopen, .katex .mclose, .katex .mpunct {
          visibility: visible !important;
        }
        .katex .frac-line {
          border-bottom-style: solid !important;
          border-color: #000000 !important;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            width: 100% !important;
          }
          #print-root {
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
          }
        }
      </style>
    </head>
    <body>
      <div id="print-root">
        ${cloneEl.outerHTML}
      </div>
    </body>
    </html>
  `;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // 6. Transfer loaded fonts directly from main window into iframe
  if (document.fonts && iframe.contentWindow.document.fonts) {
    try {
      document.fonts.forEach(font => {
        try {
          iframe.contentWindow?.document.fonts.add(font);
        } catch {
          // Ignore individual font add issues
        }
      });
    } catch {
      // Ignore iteration error
    }
  }

  // 7. Await fonts to be fully decoded in iframe
  try {
    if (iframe.contentWindow.document.fonts) {
      await Promise.race([
        iframe.contentWindow.document.fonts.ready,
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    }
  } catch {
    // Fallback if fonts.ready fails
  }

  // 8. Ensure all images in iframe are loaded
  const images = Array.from(iframe.contentWindow.document.images || []);
  if (images.length > 0) {
    await Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 800);
        });
      })
    );
  }

  // Give browser a short tick for layout calculation
  await new Promise(resolve => setTimeout(resolve, 200));

  // 9. Trigger print dialog
  try {
    iframe.contentWindow.focus();

    const cleanup = () => {
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch {}
      }, 1000);
    };

    iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
    // Safety fallback cleanup after 2 minutes
    setTimeout(cleanup, 120000);

    iframe.contentWindow.print();
  } catch (err) {
    console.error('Print failed:', err);
    window.print();
  }
};
