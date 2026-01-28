/**
 * Get Bengali font - always loads Kalpurush from public folder
 */
export const fetchBengaliFont = async (): Promise<ArrayBuffer> => {
  // Load Kalpurush font from public folder
  try {
    console.log("Loading Kalpurush font...");
    const response = await fetch('/kalpurush.ttf');
    if (!response.ok) {
      throw new Error(`Failed to fetch Kalpurush font: ${response.status} ${response.statusText}`);
    }
    const fontBytes = await response.arrayBuffer();
    console.log("Kalpurush font loaded successfully.");
    return fontBytes;
  } catch (error) {
    console.error("Error loading Kalpurush font:", error);
    throw new Error('Failed to load Bengali font. Please ensure kalpurush.ttf is in the public folder.');
  }
};
