import { PDFDocument, rgb, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { VoterData, TemplateConfig, PageSize, GlobalVoterInfo } from '../types';
import { fetchBengaliFont } from './fontLoader';

/**
 * Extraction Logic
 * Sends PDF to backend API which uses Tesseract OCR to extract voter data.
 * Returns parsed JSON data from the backend.
 */
export const extractVotersFromPDF = async (fileData: ArrayBuffer): Promise<VoterData[]> => {
  try {
    const spaceId = import.meta.env.VITE_API_URL;
    if (!spaceId) {
      throw new Error('Backend Space ID not configured. Please set VITE_API_URL in .env.local');
    }

    console.log('Connecting to Hugging Face Space:', spaceId);

    // Dynamically import the Gradio client
    const { Client } = await import('@gradio/client');

    console.log('Preparing PDF file for upload...');

    // Create a File object (not just Blob) with proper filename
    const blob = new Blob([fileData], { type: 'application/pdf' });
    const file = new File([blob], 'voter_list.pdf', { 
      type: 'application/pdf',
      lastModified: Date.now()
    });
    
    console.log('Connecting to client...');

    // Connect to the Hugging Face Space
    const client = await Client.connect(spaceId);

    console.log('Uploading PDF to backend for OCR extraction...');

    // Use client.submit instead of client.predict to handle file uploads better
    const submission = client.submit("/predict", { 
      pdf_file: file
    });

    console.log('Submission created, waiting for messages...');

    // Wait for the result without timeout - let it take as long as needed
    let voters: VoterData[] = [];
    let hasData = false;
    let messageCount = 0;
    
    console.log('Starting to listen for messages...');
    
    try {
      for await (const message of submission) {
        messageCount++;
        console.log(`=== Message #${messageCount} ===`);
        console.log('Message type:', message.type);
        console.log('Full message:', JSON.stringify(message, null, 2));
        
        if (message.type === "data") {
          hasData = true;
          console.log('Received data from backend');
          console.log('Result data:', message.data);
          
          const responseData = message.data[0];
          
          // Check if it's an error object
          if (responseData && typeof responseData === 'object' && 'error' in responseData) {
            throw new Error(String(responseData.error));
          }
          
          // Parse the data
          if (Array.isArray(responseData)) {
            voters = responseData as VoterData[];
          } else if (typeof responseData === 'object' && responseData !== null) {
            // Don't wrap non-array objects, skip them
            console.warn('Received non-array response data:', responseData);
          }
          
          break; // Exit after receiving data
        } else if (message.type === "status") {
          console.log('Status:', message.stage, typeof message.message === 'string' ? message.message : '');
          
          if (message.stage === "error") {
            const errorMsg = typeof message.message === 'string' ? message.message : 'Unknown error from backend';
            throw new Error(errorMsg);
          }
          
          if (message.stage === "complete") {
            console.log('Processing complete');
            break;
          }
        }
      }
      
      console.log(`Total messages received: ${messageCount}`);
      console.log(`Has data: ${hasData}`);
    } catch (err) {
      console.error('Error in message loop:', err);
      throw err;
    }

    if (!hasData || voters.length === 0) {
      throw new Error('No voters extracted from PDF. The backend may have returned empty results.');
    }

    console.log(`✓ Extraction complete: ${voters.length} voters received from backend`);
    return voters;
  } catch (error) {
    console.error('PDF Extraction Error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error instanceof Error) {
      throw new Error(`Backend error: ${error.message}`);
    }
    throw new Error('Failed to extract voters from PDF. Please check your internet connection and try again.');
  }
};



/**
 * Helper function to wrap text to multiple lines
 */
const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
};

/**
 * PDF Generation Logic with new layout system
 * Creates voter slips with specified aspect ratio, distributed uniformly on page
 */
export const generatePDF = async (
  voters: VoterData[],
  templateConfig: TemplateConfig | null,
  pageSize: PageSize,
  aspectRatio: import('../types').AspectRatio,
  globalInfo: GlobalVoterInfo
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  
  // Load Bengali font with proper settings
  const bengaliFont = await fetchBengaliFont();
  const customFont = await pdfDoc.embedFont(bengaliFont, { subset: true });

  // Define Page Dimensions
  const pageDims = pageSize === 'A4' 
    ? { width: 595.28, height: 841.89 }
    : { width: 612.00, height: 1008.00 };

  // Calculate slip dimensions based on aspect ratio
  const PAGE_MARGIN = 30; // Total margin for all edges
  let slipWidth: number, slipHeight: number;
  
  if (aspectRatio === '1:1') {
    // Square slips: Calculate to fit 2 columns x 3 rows = 6 slips per page
    const availableWidth = pageDims.width - (PAGE_MARGIN * 2);
    const availableHeight = pageDims.height - (PAGE_MARGIN * 2);
    const size = Math.min(availableWidth / 2, availableHeight / 3) - 10; // 10 for inter-slip margin
    slipWidth = size;
    slipHeight = size;
  } else {
    // 3:4 Portrait slips: Calculate to fit 2 columns x 2 rows
    const availableWidth = pageDims.width - (PAGE_MARGIN * 2);
    const availableHeight = pageDims.height - (PAGE_MARGIN * 2);
    const widthPerSlip = availableWidth / 2 - 15;
    const heightPerSlip = availableHeight / 2 - 15;
    
    // Maintain 3:4 aspect ratio
    if (widthPerSlip / heightPerSlip > 3 / 4) {
      slipHeight = heightPerSlip;
      slipWidth = slipHeight * (3 / 4);
    } else {
      slipWidth = widthPerSlip;
      slipHeight = slipWidth * (4 / 3);
    }
  }

  // Calculate grid layout
  const cols = aspectRatio === '1:1' ? 2 : 2;
  const rows = aspectRatio === '1:1' ? 3 : 2;
  const slipsPerPage = cols * rows;

  // Calculate actual spacing for uniform distribution
  const totalSlipsWidth = slipWidth * cols;
  const totalSlipsHeight = slipHeight * rows;
  const horizontalGap = (pageDims.width - totalSlipsWidth) / (cols + 1);
  const verticalGap = (pageDims.height - totalSlipsHeight) / (rows + 1);

  // Load custom template if provided
  let templateImage: any = null;
  if (templateConfig) {
    if (templateConfig.fileType === 'pdf') {
      const templatePdf = await PDFDocument.load(templateConfig.file);
      [templateImage] = await pdfDoc.embedPdf(templatePdf, [0]);
    } else {
      // Image (JPG/PNG)
      const fileType = templateConfig.name.toLowerCase();
      if (fileType.endsWith('.jpg') || fileType.endsWith('.jpeg')) {
        templateImage = await pdfDoc.embedJpg(templateConfig.file);
      } else if (fileType.endsWith('.png')) {
        templateImage = await pdfDoc.embedPng(templateConfig.file);
      }
    }
  }

  let currentPage = pdfDoc.addPage([pageDims.width, pageDims.height]);
  
  for (let i = 0; i < voters.length; i++) {
    if (i > 0 && i % slipsPerPage === 0) {
      currentPage = pdfDoc.addPage([pageDims.width, pageDims.height]);
    }

    const indexOnPage = i % slipsPerPage;
    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    // Calculate position (Bottom-Left origin in PDF)
    const x = horizontalGap + (col * (slipWidth + horizontalGap));
    const y = pageDims.height - verticalGap - ((row + 1) * slipHeight) - (row * verticalGap);

    // Draw template background or grey default
    if (templateImage) {
      if (templateConfig?.fileType === 'pdf') {
        currentPage.drawPage(templateImage, { x, y, width: slipWidth, height: slipHeight });
      } else {
        currentPage.drawImage(templateImage, { x, y, width: slipWidth, height: slipHeight });
      }
    } else {
      currentPage.drawRectangle({
        x, y,
        width: slipWidth,
        height: slipHeight,
        color: rgb(0.85, 0.85, 0.85),
      });
    }

    // Layout calculations based on template height
    const TOP_RESERVED = slipHeight * 0.40;
    const BOX1_HEIGHT = slipHeight * 0.15;
    const GAP_HEIGHT = slipHeight * 0.025;
    const BOX2_HEIGHT = slipHeight * 0.35;
    const HORIZONTAL_MARGIN = slipWidth * 0.025;

    const box1Y = y + slipHeight - TOP_RESERVED - BOX1_HEIGHT;
    const box2Y = box1Y - GAP_HEIGHT - BOX2_HEIGHT;

    const boxWidth = slipWidth - (HORIZONTAL_MARGIN * 2);
    const boxX = x + HORIZONTAL_MARGIN;
    const commonFontSize = Math.min(10, BOX2_HEIGHT / 9);
    const box1Padding = 6;
    const box2Padding = 6;
    const lineHeight = commonFontSize + 3;
    
    const voter = voters[i];

    // Helper function to draw rounded rectangle
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      // Draw main rectangle body (without corners)
      currentPage.drawRectangle({
        x: x + radius,
        y: y,
        width: width - (radius * 2),
        height: height,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });
      currentPage.drawRectangle({
        x: x,
        y: y + radius,
        width: width,
        height: height - (radius * 2),
        color: rgb(1, 1, 1),
        borderWidth: 0,
      });
      
      // Draw corner circles
      const corners = [
        { x: x + radius, y: y + height - radius }, // Top-left
        { x: x + width - radius, y: y + height - radius }, // Top-right
        { x: x + radius, y: y + radius }, // Bottom-left
        { x: x + width - radius, y: y + radius }, // Bottom-right
      ];
      corners.forEach(corner => {
        currentPage.drawCircle({
          x: corner.x,
          y: corner.y,
          size: radius,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      });
    };

    // Draw First Rectangle Box (Vote Center & Area)
    const cornerRadius = 6;
    drawRoundedRect(boxX, box1Y, boxWidth, BOX1_HEIGHT, cornerRadius);

    // Text inside Box 1
    let box1TextY = box1Y + BOX1_HEIGHT - box1Padding - commonFontSize;

    if (globalInfo.voteCenter) {
      const centerLines = wrapText(`কেন্দ্র: ${globalInfo.voteCenter}`, customFont, commonFontSize, boxWidth - (box1Padding * 2));
      for (let line of centerLines.slice(0, 2)) {
        currentPage.drawText(line, {
          x: boxX + box1Padding,
          y: box1TextY,
          size: commonFontSize,
          font: customFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        box1TextY -= commonFontSize + 2;
      }
    }

    if (globalInfo.voterArea) {
      const areaLines = wrapText(`এলাকা: ${globalInfo.voterArea}`, customFont, commonFontSize, boxWidth - (box1Padding * 2));
      for (let line of areaLines.slice(0, 2)) {
        currentPage.drawText(line, {
          x: boxX + box1Padding,
          y: box1TextY,
          size: commonFontSize,
          font: customFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        box1TextY -= commonFontSize + 2;
      }
    }

    // Draw Second Rectangle Box (Voter Info)
    drawRoundedRect(boxX, box2Y, boxWidth, BOX2_HEIGHT, cornerRadius);

    // Text inside Box 2 - Voter Info
    let box2TextY = box2Y + BOX2_HEIGHT - box2Padding - commonFontSize;

    // Line 1: Serial + Name
    const line1 = `${voter.serial_no}. ${voter.voter_name_bn}`;
    currentPage.drawText(line1, {
      x: boxX + box2Padding,
      y: box2TextY,
      size: commonFontSize,
      font: customFont,
      color: rgb(0, 0, 0),
    });
    box2TextY -= lineHeight;

    // Line 2: Voter No
    currentPage.drawText(voter.voter_no_bd, {
      x: boxX + box2Padding,
      y: box2TextY,
      size: commonFontSize,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    box2TextY -= lineHeight;

    // Line 3: Father
    currentPage.drawText(`পিতা: ${voter.father_name_bn}`, {
      x: boxX + box2Padding,
      y: box2TextY,
      size: commonFontSize,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    box2TextY -= lineHeight;

    // Line 4: Mother
    currentPage.drawText(`মাতা: ${voter.mother_name_bn}`, {
      x: boxX + box2Padding,
      y: box2TextY,
      size: commonFontSize,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    box2TextY -= lineHeight;

    // Line 5: Profession + DOB
    const line5 = `${voter.profession_bn || 'N/A'} | ${voter.date_of_birth_bn || 'N/A'}`;
    currentPage.drawText(line5, {
      x: boxX + box2Padding,
      y: box2TextY,
      size: commonFontSize,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    box2TextY -= lineHeight;

    // Line 6: Address (max 2 lines)
    if (voter.address_bn && voter.address_bn !== 'N/A') {
      const addressLines = wrapText(voter.address_bn, customFont, commonFontSize, boxWidth - (box2Padding * 2));
      for (let line of addressLines.slice(0, 2)) {
        currentPage.drawText(line, {
          x: boxX + box2Padding,
          y: box2TextY,
          size: commonFontSize,
          font: customFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        box2TextY -= lineHeight - 1;
      }
    }
  }

  return pdfDoc.save();
};
