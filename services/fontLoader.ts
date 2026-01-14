// Optional Bengali font storage
let uploadedFontBytes: ArrayBuffer | null = null;

/**
 * Set Bengali font from user upload
 */
export const setBengaliFont = (fontBytes: ArrayBuffer | null) => {
  uploadedFontBytes = fontBytes;
};

/**
 * Get Bengali font - returns uploaded font or default Kalpurush from assets
 */
export const fetchBengaliFont = async (): Promise<ArrayBuffer | null> => {
  if (uploadedFontBytes) {
    console.log("Using uploaded Bengali font.");
    return uploadedFontBytes;
  }
  
  // Load default Kalpurush font from assets
  try {
    console.log("Loading default Kalpurush font from assets...");
    const response = await fetch('/assets/kalpurush.ttf');
    if (!response.ok) {
      throw new Error('Failed to fetch Kalpurush font');
    }
    const fontBytes = await response.arrayBuffer();
    console.log("Default Kalpurush font loaded successfully.");
    return fontBytes;
  } catch (error) {
    console.error("Error loading default Kalpurush font:", error);
    return null;
  }
};
