/**
 * Get Bengali font - always loads Kalpurush from assets
 */
export const fetchBengaliFont = async (): Promise<ArrayBuffer | null> => {
  // Load Kalpurush font from assets
  try {
    console.log("Loading Kalpurush font from assets...");
    const response = await fetch('/assets/kalpurush.ttf');
    if (!response.ok) {
      throw new Error('Failed to fetch Kalpurush font');
    }
    const fontBytes = await response.arrayBuffer();
    console.log("Kalpurush font loaded successfully.");
    return fontBytes;
  } catch (error) {
    console.error("Error loading Kalpurush font:", error);
    return null;
  }
};
