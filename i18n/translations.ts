export type Language = 'en' | 'bn';

export const translations = {
  en: {
    // Header
    appTitle: 'Voter Slip Generator',
    
    // Steps
    step1: 'Voter Data',
    step2: 'Center & Area Info',
    step2_5: 'Bengali Font',
    step3: 'Slip Template',
    step4: 'Output Settings',
    
    // Actions
    uploadVoterList: 'Upload Voter List PDF',
    loadSampleData: 'Load Sample Data',
    or: 'Or',
    reset: 'Reset',
    generate: 'Generate Voter Slips',
    processing: 'Processing...',
    uploadButton: 'Upload & Process',
    remove: 'Remove',
    clearFont: 'Clear Font',
    
    // Labels
    voteCenter: 'Vote Center',
    voterArea: 'Voter Area',
    optional: 'Optional',
    dataPreview: 'Data Preview',
    
    // Placeholders
    voteCenterPlaceholder: 'e.g. সোনাতলা হাই স্কুল',
    voterAreaPlaceholder: 'e.g. ওয়ার্ড নং ৫',
    
    // Messages
    usingDefaultTemplate: 'Using Default Template',
    defaultTemplateDesc: 'A standard layout will be generated automatically. You can enter the Center and Area info above.',
    customTemplateActive: 'Custom Template Active',
    usingDefaultFont: 'Using Default Font',
    defaultFontDesc: 'Default Kalpurush font will be used. You can upload a different Bengali font (.ttf or .otf) for custom rendering.',
    bengaliFontLoaded: '✓ Custom Bengali Font Loaded',
    uploadBengaliFont: 'Upload Custom Bengali Font',
    fontRecommendation: 'Default: Kalpurush (from assets). You can upload: Noto Sans Bengali, etc.',
    clickToUpload: 'Click to upload PDF Template',
    templateMarkers: 'Must contain markers like {{NAME}}, {{SERIAL}}',
    noDataYet: 'No extracted data yet.',
    uploadOrLoad: 'Upload a PDF or load sample data to preview.',
    placeholderSupport: 'Supported placeholders:',
    
    // Page sizes
    a4Paper: 'A4 Paper',
    legalPaper: 'Legal Paper',
    
    // Toast messages
    votersExtracted: 'voters extracted successfully.',
    noStructuredData: "No structured data found. Try 'Load Sample Data' for demo.",
    errorReadingPdf: 'Error reading PDF file.',
    sampleDataLoaded: 'Sample data loaded.',
    noVoterData: 'No voter data available.',
    pdfGeneratedSuccess: 'PDF generated successfully!',
    pdfGenerationFailed: 'Failed to generate PDF. Check console.',
    benhaliFontRequired: 'Kalpurush font failed to load from assets. Please check the font file.',
    allDataCleared: 'All data cleared.',
    
    // Voter fields
    serial: '#',
    father: 'Father:',
    mother: 'Mother:',
    center: 'Center:',
  },
  bn: {
    // Header
    appTitle: 'Voter Slip Generator',
    
    // Steps
    step1: 'ভোটার ডেটা',
    step2: 'কেন্দ্র ও এলাকার তথ্য',
    step2_5: 'বাংলা ফন্ট',
    step3: 'স্লিপ টেমপ্লেট',
    step4: 'আউটপুট সেটিংস',
    
    // Actions
    uploadVoterList: 'ভোটার তালিকা PDF আপলোড করুন',
    loadSampleData: 'নমুনা ডেটা লোড করুন',
    or: 'অথবা',
    reset: 'রিসেট',
    generate: 'ভোটার স্লিপ তৈরি করুন',
    processing: 'প্রক্রিয়াধীন...',
    uploadButton: 'আপলোড ও প্রক্রিয়া করুন',
    remove: 'সরান',
    clearFont: 'ফন্ট মুছুন',
    
    // Labels
    voteCenter: 'ভোট কেন্দ্র',
    voterArea: 'ভোটার এলাকা',
    optional: 'ঐচ্ছিক',
    dataPreview: 'ডেটা প্রিভিউ',
    
    // Placeholders
    voteCenterPlaceholder: 'যেমন: সোনাতলা হাই স্কুল',
    voterAreaPlaceholder: 'যেমন: ওয়ার্ড নং ৫',
    
    // Messages
    usingDefaultTemplate: 'ডিফল্ট টেমপ্লেট ব্যবহার করা হচ্ছে',
    defaultTemplateDesc: 'একটি স্ট্যান্ডার্ড লেআউট স্বয়ংক্রিয়ভাবে তৈরি হবে। আপনি উপরে কেন্দ্র এবং এলাকার তথ্য প্রবেশ করতে পারেন।',
    customTemplateActive: 'কাস্টম টেমপ্লেট সক্রিয়',
    usingDefaultFont: 'ডিফল্ট ফন্ট ব্যবহার করা হচ্ছে',
    defaultFontDesc: 'ডিফল্ট কালপুরুষ ফন্ট ব্যবহার করা হবে। কাস্টম রেন্ডারিংয়ের জন্য আপনি একটি ভিন্ন বাংলা ফন্ট (.ttf বা .otf) আপলোড করতে পারেন।',
    bengaliFontLoaded: '✓ কাস্টম বাংলা ফন্ট লোড হয়েছে',
    uploadBengaliFont: 'কাস্টম বাংলা ফন্ট আপলোড করুন',
    fontRecommendation: 'ডিফল্ট: কালপুরুষ (অ্যাসেট থেকে)। আপনি আপলোড করতে পারেন: নোটো সান্স বাংলা, ইত্যাদি।',
    clickToUpload: 'PDF টেমপ্লেট আপলোড করতে ক্লিক করুন',
    templateMarkers: 'অবশ্যই {{NAME}}, {{SERIAL}} এর মত মার্কার থাকতে হবে',
    noDataYet: 'এখনো কোন ডেটা নিষ্কাশিত হয়নি।',
    uploadOrLoad: 'প্রিভিউ করতে একটি PDF আপলোড করুন বা নমুনা ডেটা লোড করুন।',
    placeholderSupport: 'সমর্থিত প্লেসহোল্ডার:',
    
    // Page sizes
    a4Paper: 'A4 কাগজ',
    legalPaper: 'লিগ্যাল কাগজ',
    
    // Toast messages
    votersExtracted: 'জন ভোটার সফলভাবে নিষ্কাশিত হয়েছে।',
    noStructuredData: "কোন কাঠামোগত ডেটা পাওয়া যায়নি। ডেমোর জন্য 'নমুনা ডেটা লোড করুন' ব্যবহার করুন।",
    errorReadingPdf: 'PDF ফাইল পড়তে ত্রুটি।',
    sampleDataLoaded: 'নমুনা ডেটা লোড হয়েছে।',
    noVoterData: 'কোন ভোটার ডেটা উপলব্ধ নেই।',
    pdfGeneratedSuccess: 'PDF সফলভাবে তৈরি হয়েছে!',
    pdfGenerationFailed: 'PDF তৈরি করতে ব্যর্থ। কনসোল চেক করুন।',
    benhaliFontRequired: 'অ্যাসেট থেকে কালপুরুষ ফন্ট লোড করতে ব্যর্থ। অনুগ্রহ করে ফন্ট ফাইল পরীক্ষা করুন।',
    allDataCleared: 'সকল ডেটা মুছে ফেলা হয়েছে।',
    
    // Voter fields
    serial: '#',
    father: 'পিতা:',
    mother: 'মাতা:',
    center: 'কেন্দ্র:',
  }
};
