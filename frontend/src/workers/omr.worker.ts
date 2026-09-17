/* eslint-disable no-restricted-globals */

// This worker runs OpenCV processing to keep the main UI thread unblocked
self.importScripts('https://docs.opencv.org/4.8.0/opencv.js');

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  if (type === 'INIT') {
    // Wait for OpenCV to initialize
    const checkCv = setInterval(() => {
      if (typeof (self as any).cv !== 'undefined' && (self as any).cv.Mat) {
        clearInterval(checkCv);
        self.postMessage({ type: 'INIT_SUCCESS' });
      }
    }, 100);
  }

  if (type === 'PROCESS_IMAGE') {
    const { imageData, id } = payload;
    try {
      const result = await processOMR(imageData);
      self.postMessage({ type: 'PROCESS_SUCCESS', payload: { id, result } });
    } catch (error: any) {
      self.postMessage({ type: 'PROCESS_ERROR', payload: { id, error: error.message } });
    }
  }
};

async function processOMR(imageData: ImageData) {
  const cv = (self as any).cv;
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  
  // 1. Grayscale & Blur
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
  
  // 2. Thresholding to find contours (black markers)
  const thresh = new cv.Mat();
  cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);
  
  // 3. Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Find the 4 corner markers (fiducials)
  // Fiducials are usually the largest square-ish contours
  let corners = [];
  for (let i = 0; i < contours.size(); i++) {
    const cnt = contours.get(i);
    const area = cv.contourArea(cnt);
    if (area > 500 && area < 50000) {
      const peri = cv.arcLength(cnt, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
      if (approx.rows === 4) {
        // It's a square/rectangle
        const rect = cv.boundingRect(cnt);
        corners.push({ x: rect.x + rect.width/2, y: rect.y + rect.height/2, area });
      }
      approx.delete();
    }
  }
  
  // If we found exactly or more than 4, we take the 4 outermost
  if (corners.length < 4) {
    throw new Error("Could not detect the 4 corner markers.");
  }
  
  // Sort corners: TopLeft, TopRight, BottomRight, BottomLeft
  corners.sort((a, b) => a.y - b.y);
  const topCorners = corners.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottomCorners = corners.slice(corners.length - 2).sort((a, b) => a.x - b.x);
  
  const orderedCorners = [
    topCorners[0], // TL
    topCorners[1], // TR
    bottomCorners[1], // BR
    bottomCorners[0]  // BL
  ];

  // 4. Perspective Transform (Warp)
  // Target dimensions for a standard A4 OMR
  const width = 1200;
  const height = 1600;
  
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    orderedCorners[0].x, orderedCorners[0].y,
    orderedCorners[1].x, orderedCorners[1].y,
    orderedCorners[2].x, orderedCorners[2].y,
    orderedCorners[3].x, orderedCorners[3].y
  ]);
  
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    width, 0,
    width, height,
    0, height
  ]);
  
  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  const warped = new cv.Mat();
  cv.warpPerspective(gray, warped, M, new cv.Size(width, height));
  
  // Clean up initial mats
  src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); srcTri.delete(); dstTri.delete(); M.delete();

  // 5. Apply threshold to warped image for bubble detection
  const warpedThresh = new cv.Mat();
  cv.threshold(warped, warpedThresh, 0, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);

  // --- Extract Student ID ---
  // Coordinates are relative to the 1200x1600 warped image.
  // We need to fine-tune these ROIs based on the exact image.
  // For now, this is the structural implementation.
  const studentId = extractStudentID(warpedThresh, cv);
  
  // --- Extract 75 Answers ---
  const answers = extractAnswers(warpedThresh, cv);

  warped.delete(); warpedThresh.delete();

  return { studentId, answers };
}

function extractStudentID(threshMat: any, cv: any) {
  // Configurable ROI (Region of Interest) for the Student ID block
  // This needs to be calibrated to the specific printed OMR sheet proportions
  // Format: [x, y, width, height] relative to 1200x1600 warped image
  const roi = new cv.Rect(100, 200, 300, 300); // placeholder
  const studentIdMat = threshMat.roi(roi);
  
  // Example Logic: Divide the ROI into 8 columns and 10 rows
  // Calculate pixel density for each bubble
  let studentId = "S1234567"; // Mock until calibrated
  
  studentIdMat.delete();
  return studentId;
}

function extractAnswers(threshMat: any, cv: any) {
  const ans: Record<number, string> = {};
  
  // The 75 questions are divided into 5 columns
  // Each column has 15 questions. Each question has 4 bubbles (A, B, C, D)
  // We need 5 ROIs for the 5 columns. (Placeholders below)
  const columnROIs = [
    new cv.Rect(50, 600, 200, 800), // Col 1 (Q1-15)
    new cv.Rect(280, 600, 200, 800), // Col 2 (Q16-30)
    new cv.Rect(510, 600, 200, 800), // Col 3 (Q31-45)
    new cv.Rect(740, 600, 200, 800), // Col 4 (Q46-60)
    new cv.Rect(970, 600, 200, 800), // Col 5 (Q61-75)
  ];
  
  const options = ['A', 'B', 'C', 'D'];
  let currentQ = 1;

  for (let c = 0; c < 5; c++) {
    const colMat = threshMat.roi(columnROIs[c]);
    const qHeight = Math.floor(columnROIs[c].height / 15);
    const optWidth = Math.floor(columnROIs[c].width / 4);

    for (let q = 0; q < 15; q++) {
      let maxPixels = 0;
      let selectedOption = "-";
      let multipleMarked = false;

      // Extract each option bubble A, B, C, D
      for (let o = 0; o < 4; o++) {
        // Create bounding box for the specific bubble
        const bubbleRect = new cv.Rect(o * optWidth, q * qHeight, optWidth, qHeight);
        const bubbleMat = colMat.roi(bubbleRect);
        
        // Count non-zero pixels (since thresh is BINARY_INV, filled bubbles will be white)
        const filledPixels = cv.countNonZero(bubbleMat);
        
        // Threshold logic: If bubble is > 40% filled
        const totalArea = optWidth * qHeight;
        if (filledPixels > totalArea * 0.4) {
          if (selectedOption !== "-") {
            multipleMarked = true; // Doubly bubbled
          } else {
            selectedOption = options[o];
            maxPixels = filledPixels;
          }
        }
        bubbleMat.delete();
      }

      ans[currentQ] = multipleMarked ? "DOUBTFUL" : selectedOption;
      currentQ++;
    }
    colMat.delete();
  }
  
  return ans;
}
