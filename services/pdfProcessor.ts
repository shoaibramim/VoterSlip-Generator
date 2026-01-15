import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, PDFFont, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { VoterData, TemplateConfig, PageSize, TemplateFieldLocation, GlobalVoterInfo } from '../types';
import { fetchBengaliFont } from './fontLoader';

// Configure PDF.js worker - using unpkg CDN with correct path
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Interface for text item with position
 */
interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cluster text items into groups based on spatial proximity
 */
const clusterTextItems = (items: TextItem[]): TextItem[][] => {
  if (items.length === 0) return [];
  
  const clusters: TextItem[][] = [];
  const visited = new Set<number>();
  
  // Sort by Y position first (top to bottom), then X (left to right)
  const sortedItems = [...items].sort((a, b) => {
    const yDiff = b.y - a.y; // Higher Y first (PDF coordinates)
    if (Math.abs(yDiff) > 10) return yDiff;
    return a.x - b.x;
  });
  
  const isNearby = (item1: TextItem, item2: TextItem): boolean => {
    const xDistance = Math.abs(item1.x - item2.x);
    const yDistance = Math.abs(item1.y - item2.y);
    
    // Items are in same cluster if they're within reasonable distance
    // Typical voter card dimensions: ~200x150 points
    return xDistance < 250 && yDistance < 200;
  };
  
  for (let i = 0; i < sortedItems.length; i++) {
    if (visited.has(i)) continue;
    
    const cluster: TextItem[] = [sortedItems[i]];
    visited.add(i);
    
    // Find all nearby items
    for (let j = i + 1; j < sortedItems.length; j++) {
      if (visited.has(j)) continue;
      
      // Check if this item is close to any item in current cluster
      const isInCluster = cluster.some(clusterItem => isNearby(clusterItem, sortedItems[j]));
      
      if (isInCluster) {
        cluster.push(sortedItems[j]);
        visited.add(j);
      }
    }
    
    // Only keep clusters with at least 3 text items (minimum for a voter card)
    if (cluster.length >= 3) {
      clusters.push(cluster);
    }
  }
  
  return clusters;
};

/**
 * Parse voter data from clustered text items
 */
const parseVoterFromCluster = (cluster: TextItem[], boxIndex: number): VoterData | null => {
  // Sort cluster items by Y (top to bottom), then X (left to right)
  const sortedCluster = [...cluster].sort((a, b) => {
    const yDiff = b.y - a.y;
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.x - b.x;
  });
  
  const texts = sortedCluster.map(item => item.text);
  const fullText = texts.join(' ');
  
  // Must contain Bengali text and some digits to be a voter card
  if (!/[\u0980-\u09FF]/.test(fullText) || !/[\d০-৯]/.test(fullText)) {
    return null;
  }
  
  let voterName = '';
  let voterNo = '';
  let fatherName = '';
  let motherName = '';
  let dob = '';
  let profession = '';
  let address = '';
  
  // Parse line by line with context awareness
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i].trim();
    if (!text) continue;
    
    const nextText = i + 1 < texts.length ? texts[i + 1].trim() : '';
    const textLower = text.toLowerCase();
    
    // Voter name detection
    if ((textLower.includes('নাম') || textLower.includes('name')) && !textLower.includes('পিতা') && !textLower.includes('মাতা')) {
      // Next non-empty text is likely the name
      for (let j = i + 1; j < texts.length; j++) {
        const candidate = texts[j].trim();
        if (candidate && candidate.length > 2 && !/^[:\-\s]+$/.test(candidate)) {
          voterName = candidate;
          break;
        }
      }
    }
    
    // Voter number detection
    if ((textLower.includes('ভোটার') || textLower.includes('voter') || textLower.includes('নং') || textLower.includes('no')) 
        && !textLower.includes('ক্রমিক')) {
      // Look for numbers nearby
      for (let j = i + 1; j < Math.min(i + 3, texts.length); j++) {
        const candidate = texts[j].trim();
        if (/[\d০-৯]{5,}/.test(candidate)) {
          voterNo = candidate;
          break;
        }
      }
    }
    
    // Father's name
    if (textLower.includes('পিতা') || textLower.includes('father')) {
      for (let j = i + 1; j < texts.length; j++) {
        const candidate = texts[j].trim();
        if (candidate && candidate.length > 2 && /[\u0980-\u09FF]/.test(candidate) && !candidate.includes('মাতা')) {
          fatherName = candidate;
          break;
        }
      }
    }
    
    // Mother's name
    if (textLower.includes('মাতা') || textLower.includes('mother')) {
      for (let j = i + 1; j < texts.length; j++) {
        const candidate = texts[j].trim();
        if (candidate && candidate.length > 2 && /[\u0980-\u09FF]/.test(candidate)) {
          motherName = candidate;
          break;
        }
      }
    }
    
    // Date of birth
    if (textLower.includes('জন্ম') || textLower.includes('birth') || textLower.includes('তারিখ') || textLower.includes('date')) {
      for (let j = i + 1; j < Math.min(i + 3, texts.length); j++) {
        const candidate = texts[j].trim();
        if (/[\d০-৯\/\-\.]/.test(candidate)) {
          dob = candidate;
          break;
        }
      }
    }
    
    // If we haven't found a name yet and this looks like a Bengali name (not a label)
    if (!voterName && text.length > 3 && /[\u0980-\u09FF]{3,}/.test(text)) {
      const isLabel = textLower.includes('পিতা') || textLower.includes('মাতা') || 
                      textLower.includes('ঠিকানা') || textLower.includes('পেশা') ||
                      textLower.includes('জন্ম') || textLower.includes('ভোটার');
      if (!isLabel) {
        voterName = text;
      }
    }
    
    // If we haven't found voter number and this looks like one
    if (!voterNo && /[\d০-৯]{7,}/.test(text)) {
      voterNo = text;
    }
  }
  
  // Validation: Must have name AND voter number
  if (!voterName || !voterNo) {
    return null;
  }
  
  return {
    id: `voter_${boxIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    serial_no: boxIndex.toString(),
    voter_name_bn: voterName,
    voter_no_bd: voterNo,
    father_name_bn: fatherName || 'N/A',
    mother_name_bn: motherName || 'N/A',
    profession_bn: profession,
    date_of_birth_bn: dob,
    address_bn: address,
  };
};

/**
 * Extraction Logic
 * Calls the Hugging Face Gradio API to extract voter data using Tesseract OCR.
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
 * Template Analysis
 * Scans the template PDF to find placeholder tokens like {{NAME}}
 */
export const analyzeTemplate = async (fileData: ArrayBuffer): Promise<TemplateConfig> => {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: fileData });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // Assume template is single page
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const mappings: Record<string, TemplateFieldLocation> = {};
    
    // Regex to find tokens {{KEY}} or {{key}}
    const tokenRegex = /\{\{([\w_]+)\}\}/;

    for (const item of textContent.items as any[]) {
      const match = item.str.match(tokenRegex);
      if (match) {
        const key = match[1]; // e.g., VOTER_NAME
        const tx = item.transform[4];
        const ty = item.transform[5];
        
        mappings[key] = {
          pageIndex: 0,
          x: tx,
          y: ty,
          fontSize: item.height || 12,
          key
        };
      }
    }

    return {
      file: new Uint8Array(fileData),
      name: 'Custom Template',
      mappings,
      width: viewport.width,
      height: viewport.height
    };
  } catch (error) {
    console.error('Template Analysis Error:', error);
    throw new Error('Failed to analyze template PDF. Please ensure it is a valid PDF document.');
  }
};

/**
 * Helper to check if text contains Bengali characters
 */
const hasBengaliCharacters = (text: string): boolean => {
  // Bengali Unicode range: 0x0980 - 0x09FF
  return /[\u0980-\u09FF]/.test(text);
};

/**
 * Helper to get font - always uses Kalpurush from assets
 */
const getFont = async (pdfDoc: PDFDocument, requireBengali: boolean = false): Promise<PDFFont> => {
  const fontBytes = await fetchBengaliFont();
  if (fontBytes) {
    pdfDoc.registerFontkit(fontkit);
    return await pdfDoc.embedFont(fontBytes, { subset: true });
  }
  // If font fetch failed, throw error for Bengali text
  if (requireBengali) {
    throw new Error('Kalpurush font failed to load from assets. Please check the font file.');
  }
  return await pdfDoc.embedFont(StandardFonts.Helvetica);
};

/**
 * Generate Default Template
 * Creates a standard Bengali voter slip design in memory.
 */
const createDefaultTemplate = async (): Promise<TemplateConfig> => {
  const pdfDoc = await PDFDocument.create();
  const font = await getFont(pdfDoc);

  // Size: 3.5 inch x 2.8 inch (approx standard card size with more fields)
  // 1 inch = 72 pts. 3.5 * 72 = 252, 2.8 * 72 = 201.6
  const width = 260;
  const height = 210;
  const page = pdfDoc.addPage([width, height]);

  // Draw Box
  const margin = 5;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - (margin * 2),
    height: height - (margin * 2),
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    opacity: 0, // Transparent fill
    borderOpacity: 1
  });

  // Header with background
  page.drawRectangle({
    x: margin,
    y: height - 35,
    width: width - (margin * 2),
    height: 25,
    color: rgb(0.95, 0.95, 0.98),
  });
  
  page.drawText('VOTER SLIP', {
    x: width / 2 - 35,
    y: height - 20,
    size: 12,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawLine({
    start: { x: margin + 5, y: height - 38 },
    end: { x: width - margin - 5, y: height - 38 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  const fontSize = 9;
  const leftX = 12;
  const rightX = 140; // X position for right side fields
  let currentY = height - 52;
  const lineHeight = 14;

  const mappings: Record<string, TemplateFieldLocation> = {};

  // Vote Center and Voter Area at the top
  page.drawText('ভোট কেন্দ্র:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['VOTE_CENTER'] = {
    pageIndex: 0,
    x: leftX + 60,
    y: currentY,
    fontSize: fontSize,
    key: 'VOTE_CENTER'
  };
  currentY -= lineHeight;

  page.drawText('ভোটার এলাকা:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['VOTER_AREA'] = {
    pageIndex: 0,
    x: leftX + 60,
    y: currentY,
    fontSize: fontSize,
    key: 'VOTER_AREA'
  };
  currentY -= lineHeight;
  
  // Add a separator line
  currentY -= 3;
  page.drawLine({
    start: { x: leftX, y: currentY },
    end: { x: width - leftX, y: currentY },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  currentY -= 10;
  
  // Line 1: Serial No (left) and Name (right)
  page.drawText('ক্রমিক:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['SERIAL'] = {
    pageIndex: 0,
    x: leftX + 32,
    y: currentY,
    fontSize: fontSize,
    key: 'SERIAL'
  };
  page.drawText('নাম:', { 
    x: leftX + 55, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['NAME'] = {
    pageIndex: 0,
    x: leftX + 75,
    y: currentY,
    fontSize: fontSize + 1,
    key: 'NAME'
  };
  currentY -= lineHeight;
  
  // Line 2: Voter No
  page.drawText('ভোটার নং:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['NO'] = {
    pageIndex: 0,
    x: leftX + 48,
    y: currentY,
    fontSize: fontSize,
    key: 'NO'
  };
  currentY -= lineHeight;
  
  // Line 3: Father Name
  page.drawText('পিতা:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['FATHER'] = {
    pageIndex: 0,
    x: leftX + 27,
    y: currentY,
    fontSize: fontSize,
    key: 'FATHER'
  };
  currentY -= lineHeight;
  
  // Line 4: Mother Name
  page.drawText('মাতা:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['MOTHER'] = {
    pageIndex: 0,
    x: leftX + 27,
    y: currentY,
    fontSize: fontSize,
    key: 'MOTHER'
  };
  currentY -= lineHeight;
  
  // Line 5: Profession (left) and Date of Birth (right)
  page.drawText('পেশা:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['PROFESSION'] = {
    pageIndex: 0,
    x: leftX + 27,
    y: currentY,
    fontSize: fontSize - 1,
    key: 'PROFESSION'
  };
  page.drawText('জন্ম তারিখ:', { 
    x: rightX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['DOB'] = {
    pageIndex: 0,
    x: rightX + 50,
    y: currentY,
    fontSize: fontSize - 1,
    key: 'DOB'
  };
  currentY -= lineHeight;
  
  // Line 6: Address
  page.drawText('ঠিকানা:', { 
    x: leftX, 
    y: currentY, 
    size: fontSize - 1, 
    font, 
    color: rgb(0.3, 0.3, 0.3) 
  });
  mappings['ADDRESS'] = {
    pageIndex: 0,
    x: leftX + 35,
    y: currentY,
    fontSize: fontSize - 1,
    key: 'ADDRESS'
  };

  const pdfBytes = await pdfDoc.save();

  return {
    file: pdfBytes,
    name: 'Default Template',
    mappings,
    width,
    height
  };
};

/**
 * PDF Generation Logic
 * Creates the grid layout and embeds fonts.
 */
export const generatePDF = async (
  voters: VoterData[],
  templateConfig: TemplateConfig | null,
  pageSize: PageSize,
  globalInfo: GlobalVoterInfo
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  
  // Check if any voter data or global info contains Bengali text
  const hasBengaliText = voters.some(voter => 
    Object.values(voter).some(val => typeof val === 'string' && hasBengaliCharacters(val))
  ) || hasBengaliCharacters(globalInfo.voteCenter || '') || hasBengaliCharacters(globalInfo.voterArea || '');
  
  const customFont = await getFont(pdfDoc, hasBengaliText);

  // Resolve Template: Use provided or generate default
  let templateToUse = templateConfig;
  if (!templateToUse) {
    templateToUse = await createDefaultTemplate();
  }

  // Load Template PDF
  const templatePdf = await PDFDocument.load(templateToUse.file);
  const [templatePage] = await pdfDoc.embedPdf(templatePdf, [0]); // Embed 1st page

  // Define Page Dimensions
  const pageDims = pageSize === 'A4' 
    ? { width: 595.28, height: 841.89 }
    : { width: 612.00, height: 1008.00 };

  const GRID_COLS = 2;
  const GRID_ROWS = 2;
  const ITEMS_PER_PAGE = 4;

  const margin = 20;
  const availableWidth = (pageDims.width - (margin * 3)) / GRID_COLS;
  const availableHeight = (pageDims.height - (margin * 3)) / GRID_ROWS;
  
  // Scale logic
  const scaleX = availableWidth / templateToUse.width;
  const scaleY = availableHeight / templateToUse.height;
  const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

  const cellWidth = templateToUse.width * scale;
  const cellHeight = templateToUse.height * scale;

  let currentPage = pdfDoc.addPage([pageDims.width, pageDims.height]);
  
  for (let i = 0; i < voters.length; i++) {
    if (i > 0 && i % ITEMS_PER_PAGE === 0) {
      currentPage = pdfDoc.addPage([pageDims.width, pageDims.height]);
    }

    const indexOnPage = i % ITEMS_PER_PAGE;
    const col = indexOnPage % GRID_COLS;
    const row = Math.floor(indexOnPage / GRID_COLS);

    // Calculate position (Bottom-Left origin)
    // Row 0 is Top
    const x = margin + (col * (cellWidth + margin));
    const y = pageDims.height - margin - ((row + 1) * cellHeight) - (row * margin);

    // Draw the template background
    currentPage.drawPage(templatePage, {
      x,
      y,
      width: cellWidth,
      height: cellHeight,
    });

    // Draw Data Fields
    const voter = voters[i];
    
    // Map data keys to template keys (including global info)
    const dataMap: Record<string, string | undefined> = {
      'SERIAL': voter.serial_no,
      'NAME': voter.voter_name_bn,
      'NO': voter.voter_no_bd,
      'FATHER': voter.father_name_bn,
      'MOTHER': voter.mother_name_bn,
      'DOB': voter.date_of_birth_bn,
      'PROFESSION': voter.profession_bn,
      'ADDRESS': voter.address_bn,
      'VOTE_CENTER': globalInfo.voteCenter,
      'vote_center': globalInfo.voteCenter,
      'VOTER_AREA': globalInfo.voterArea,
      'voter_area': globalInfo.voterArea,
      'CENTER': globalInfo.voteCenter,
      'AREA': globalInfo.voterArea
    };

    // Iterate through identified mappings in the template
    Object.entries(templateToUse.mappings).forEach(([key, location]) => {
      // Direct match first, then fuzzy match
      const normalizedKey = key.toUpperCase().replace(/[_-]/g, '');
      let text = dataMap[key] || '';
      
      // If no direct match, try fuzzy matching
      if (!text) {
        const dataKey = Object.keys(dataMap).find(k => {
          const normalizedDataKey = k.toUpperCase().replace(/[_-]/g, '');
          return normalizedKey.includes(normalizedDataKey) || normalizedDataKey.includes(normalizedKey);
        });
        text = dataKey ? dataMap[dataKey] || '' : '';
      }

      if (text) {
        const drawX = x + (location.x * scale);
        const drawY = y + (location.y * scale);

        currentPage.drawText(text, {
          x: drawX,
          y: drawY,
          size: (location.fontSize || 10) * scale,
          font: customFont,
          color: rgb(0, 0, 0),
        });
      }
    });
  }

  return pdfDoc.save();
};
