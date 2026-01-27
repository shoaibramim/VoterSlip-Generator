import React, { useState } from 'react';
import { Sun, Moon, Upload, FileText, Download, Users, RefreshCw, MapPin, Building, Languages } from 'lucide-react';
import { extractVotersFromPDF, generatePDF } from './services/pdfProcessor';
import { Toast } from './components/ui/Toast';
import { TemplateUploader } from './components/TemplateUploader';
import { VoterData, TemplateConfig, PageSize, AspectRatio } from './types';
import { translations, Language } from './i18n/translations';

// Mock data for demo purposes - Always in Bengali
const MOCK_VOTERS: VoterData[] = [
  {
    id: '1',
    serial_no: '০০১',
    voter_name_bn: 'আবদুর রহিম',
    voter_no_bd: '১৯৮৭৬৫৪৩২০০০১',
    father_name_bn: 'নুরুল ইসলাম',
    mother_name_bn: 'রাহেলা বেগম',
    date_of_birth_bn: '০১-০১-১৯৮০',
    profession_bn: 'কৃষক',
    address_bn: 'গ্রাম: পশ্চিম পাড়া, কাউয়ারখোপ, রামু'
  },
  {
    id: '2',
    serial_no: '০০২',
    voter_name_bn: 'ফাতেমা খাতুন',
    voter_no_bd: '১৯৯০১২৩৪৫০০০২',
    father_name_bn: 'স্বর্গীয় আবদুল জব্বার',
    mother_name_bn: 'নূরজাহান বিবি',
    date_of_birth_bn: '১৫-০৫-১৯৯০',
    profession_bn: 'গৃহিণী',
    address_bn: 'গ্রাম: পশ্চিম পাড়া, কাউয়ারখোপ, রামু'
  },
  {
    id: '3',
    serial_no: '০০৩',
    voter_name_bn: 'মো. রফিকুল ইসলাম',
    voter_no_bd: '১৯৮৫৪৪৩৩২০০০৩',
    father_name_bn: 'আজিজুর রহমান',
    mother_name_bn: 'সালেহা খাতুন',
    date_of_birth_bn: '১০-১০-১৯৮৫',
    profession_bn: 'শিক্ষক',
    address_bn: 'গ্রাম: ধুফুলনির চর, কাউয়ারখোপ, রামু'
  },
  {
    id: '4',
    serial_no: '০০৪',
    voter_name_bn: 'মোসাম্মৎ আয়েশা',
    voter_no_bd: '২০০০৭৭৮৮৯০০০৪',
    father_name_bn: 'আবুল কালাম',
    mother_name_bn: 'ফরিদা ইয়াসমিন',
    date_of_birth_bn: '২০-১২-২০০০',
    profession_bn: 'শিক্ষার্থী',
    address_bn: 'গ্রাম: কাউয়ারখোপ, রামু, কক্সবাজার'
  }
];

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isProcessingGenerate, setIsProcessingGenerate] = useState(false);
  const [uploadTimer, setUploadTimer] = useState(0);
  const [generateTimer, setGenerateTimer] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // New State for additional info
  const [voteCenter, setVoteCenter] = useState('');
  const [voterArea, setVoterArea] = useState('');
  const [selectedVoterFile, setSelectedVoterFile] = useState<File | null>(null);
  const [showJsonHelper, setShowJsonHelper] = useState(false);

  // Get current translations
  const t = translations[language];

  // Theme Toggle
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Language Toggle
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  // Step 1: Handle Voter List File Selection
  const handleVoterListFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVoterFile(file);
    }
  };

  // Step 1: Handle Voter List Upload
  const handleVoterListUpload = async () => {
    if (!selectedVoterFile) return;

    setIsProcessingUpload(true);
    setUploadTimer(0);
    
    // Start timer
    const timerInterval = setInterval(() => {
      setUploadTimer(prev => prev + 1);
    }, 1000);
    
    showToast(language === 'en' ? 'Processing PDF with OCR... This may take a moment.' : 'OCR দিয়ে PDF প্রক্রিয়া করা হচ্ছে... কিছুক্ষণ অপেক্ষা করুন।', 'success');
    
    try {
      const buffer = await selectedVoterFile.arrayBuffer();
      const extracted = await extractVotersFromPDF(buffer);
      
      clearInterval(timerInterval);
      
      if (extracted.length > 0) {
        setVoters(extracted);
        showToast(`${extracted.length} ${t.votersExtracted}`);
      } else {
        showToast(t.noStructuredData, "error");
      }
    } catch (err) {
      clearInterval(timerInterval);
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : t.errorReadingPdf;
      showToast(errorMsg, "error");
    } finally {
      clearInterval(timerInterval);
      setIsProcessingUpload(false);
      setUploadTimer(0);
    }
  };

  const loadMockData = () => {
    setVoters([...MOCK_VOTERS, ...MOCK_VOTERS, ...MOCK_VOTERS]); // Load 12 items to show multiple pages
    showToast(t.sampleDataLoaded);
    // Pre-fill with Bengali data for better demo
    setVoteCenter('কাউয়ারখোপ হাকিম রকিমা উচ্চ বিদ্যালয়');
    setVoterArea('ওয়ার্ড নং ৫');
  };
  // Handle JSON File Upload
  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show helper text when file is selected
    setShowJsonHelper(true);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // Validate that it's an array
      if (!Array.isArray(jsonData)) {
        showToast(language === 'en' ? 'Invalid JSON format. Expected an array of voter data.' : 'অবৈধ JSON ফরম্যাট। ভোটার ডেটার একটি অ্যারে প্রত্যাশিত।', 'error');
        return;
      }

      // Basic validation of required fields (id is optional, will be auto-generated)
      const requiredFields = ['serial_no', 'voter_name_bn', 'voter_no_bd', 'father_name_bn', 'mother_name_bn'];
      const isValid = jsonData.every((item: any) => 
        requiredFields.every(field => field in item)
      );

      if (!isValid) {
        showToast(language === 'en' ? 'Invalid JSON structure. Missing required fields.' : 'অবৈধ JSON কাঠামো। প্রয়োজনীয় ক্ষেত্র অনুপস্থিত।', 'error');
        return;
      }

      // Add id field if missing
      const processedData = jsonData.map((item: any, index: number) => ({
        id: item.id || `json_${index + 1}`,
        ...item
      }));

      setVoters(processedData as VoterData[]);
      showToast(`${processedData.length} ${t.votersExtracted}`);
      
      // Scroll to data preview section for better UX
      setTimeout(() => {
        document.querySelector('[data-section="data-preview"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to parse JSON file. Please check the file format.' : 'JSON ফাইল পার্স করতে ব্যর্থ। ফাইল ফরম্যাট পরীক্ষা করুন।', 'error');
    } finally {
      // Reset file input
      e.target.value = '';
    }
  };

  // Download JSON Data
  const downloadJsonData = () => {
    if (voters.length === 0) {
      showToast(t.noVoterData, 'error');
      return;
    }

    const jsonStr = JSON.stringify(voters, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voter_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(language === 'en' ? 'JSON file downloaded successfully!' : 'JSON ফাইল সফলভাবে ডাউনলোড হয়েছে!', 'success');
  };
  // Step 3: Generate PDF
  const handleGenerate = async () => {
    if (voters.length === 0) {
      showToast(t.noVoterData, "error");
      return;
    }

    // Vote Center and Voter Area are optional - use empty string if not provided
    setIsProcessingGenerate(true);
    setGenerateTimer(0);
    
    // Start timer
    const timerInterval = setInterval(() => {
      setGenerateTimer(prev => prev + 1);
    }, 1000);
    
    try {
      const pdfBytes = await generatePDF(
        voters, 
        template, 
        pageSize,
        aspectRatio,
        { voteCenter, voterArea }
      );
      
      clearInterval(timerInterval);
      
      // Trigger download
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `voter_slips_${pageSize}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast(t.pdfGeneratedSuccess);
    } catch (err) {
      clearInterval(timerInterval);
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('Bengali font is required')) {
        showToast(t.benhaliFontRequired, "error");
      } else {
        showToast(t.pdfGenerationFailed, "error");
      }
    } finally {
      clearInterval(timerInterval);
      setIsProcessingGenerate(false);
      setGenerateTimer(0);
    }
  };

  const handleReset = () => {
    setVoters([]);
    setTemplate(null);
    setAspectRatio('3:4');
    setVoteCenter('');
    setVoterArea('');
    setSelectedVoterFile(null);
    showToast(t.allDataCleared);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="text-accent h-6 w-6" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleLanguage}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                title={language === 'en' ? 'Switch to Bengali' : 'ইংরেজিতে পরিবর্তন করুন'}
              >
                <Languages size={20} className="text-blue-600 dark:text-blue-400"/>
                <span className="text-xs font-medium">{language === 'en' ? 'বাং' : 'EN'}</span>
              </button>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-600"/>}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="space-y-6">
              
              {/* Step 1: Data Source */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                    {t.step1}
                  </h2>
                  {voters.length > 0 && (
                    <button onClick={handleReset} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                      <RefreshCw size={12}/> {t.reset}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="relative border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-8 hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
                    <input
                      id="voter-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleVoterListFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <label htmlFor="voter-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload size={32} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.uploadVoterList}
                      </span>
                    </label>
                    {selectedVoterFile && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{selectedVoterFile.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{(selectedVoterFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    )}
                    {isProcessingUpload && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {selectedVoterFile && (
                    <button 
                      onClick={handleVoterListUpload}
                      disabled={isProcessingUpload}
                      className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessingUpload ? `${t.processing || 'Processing'} (${uploadTimer}s)` : t.uploadButton || 'Upload & Process'}
                    </button>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-gray-500">{t.or}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={loadMockData}
                      className="py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {t.loadSampleData}
                    </button>
                    
                    <label className="py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleJsonUpload}
                        className="hidden"
                      />
                      {language === 'en' ? 'Upload JSON' : 'JSON আপলোড'}
                    </label>
                  </div>

                  {showJsonHelper && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                          {language === 'en' ? 'JSON Structure:' : 'JSON কাঠামো:'}
                        </p>
                        <button 
                          onClick={() => setShowJsonHelper(false)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <pre className="text-[10px] text-blue-700 dark:text-blue-400 overflow-x-auto">
{`[
  {
    id: string (optional),
    serial_no: string (required),
    voter_name_bn: string (required),
    voter_no_bd: string (required),
    father_name_bn: string (required),
    mother_name_bn: string (required),
    profession_bn: string (optional),
    date_of_birth_bn: string (optional),
    address_bn: string (optional)
  }
]`}
                      </pre>
                    </div>
                  )}
                </div>
              </section>

               {/* Step 2: Global Info */}
               <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                      {t.step2}
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-gray-500">
                      {t.optional}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.voteCenter}
                      </label>
                      <div className="relative">
                        <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          value={voteCenter}
                          onChange={(e) => setVoteCenter(e.target.value)}
                          placeholder={t.voteCenterPlaceholder}
                          lang="bn"
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent font-bengali"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.voterArea}
                      </label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                         <input
                          type="text"
                          value={voterArea}
                          onChange={(e) => setVoterArea(e.target.value)}
                          placeholder={t.voterAreaPlaceholder}
                          lang="bn"
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent font-bengali"
                        />
                      </div>
                    </div>
                  </div>
              </section>
              {/* Step 3: Template */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">3</span>
                      {t.step3}
                    </h2>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-gray-500">
                      {t.optional}
                    </span>
                  </div>
                  
                  {!template ? (
                    <div className="mb-4 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t.usingDefaultTemplate}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {t.defaultTemplateDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-300">{t.customTemplateActive}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 truncate max-w-[200px]">{template.name}</p>
                        </div>
                        <button 
                          onClick={() => setTemplate(null)}
                          className="text-xs text-red-500 hover:text-red-700 underline"
                        >
                          {t.remove}
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                         {t.placeholderSupport} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{"PDF"}</code>, <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{"JPG"}</code>, <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{"PNG"}</code>
                      </div>
                    </div>
                  )}

                  <TemplateUploader
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    onTemplateLoaded={setTemplate} 
                    onError={(msg) => showToast(msg, 'error')}
                    clickToUploadText={t.clickToUpload}
                    templateMarkersText={t.templateMarkers}
                  />
              </section>
            </div>

            {/* Right Column: Preview & Action */}
            <div className="flex flex-col gap-6">
              
              {/* Data Preview with constrained height */}
              <div data-section="data-preview" className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">{t.dataPreview}</h2>
                  {voters.length > 0 && (
                    <button 
                      onClick={downloadJsonData}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      <Download size={14} />
                      {language === 'en' ? 'Download JSON' : 'JSON ডাউনলোড'}
                    </button>
                  )}
                </div>
                
                {voters.length > 0 ? (
                  <div className="overflow-auto min-h-[730px] max-h-[730px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                    {voters.map((voter, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-mono bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                             {t.serial}{voter.serial_no}
                           </span>
                           <span className="text-xs text-gray-400">{voter.voter_no_bd}</span>
                        </div>
                        <h3 className="font-bengali text-lg font-medium text-gray-900 dark:text-gray-100">
                          {voter.voter_name_bn}
                        </h3>
                        <div className="mt-1 space-y-0.5 font-bengali text-sm text-gray-600 dark:text-gray-400">
                          <p>পিতা: {voter.father_name_bn}</p>
                          <p>মাতা: {voter.mother_name_bn}</p>
                          {voter.date_of_birth_bn && voter.date_of_birth_bn !== 'N/A' && (
                            <p>জন্ম তারিখ: {voter.date_of_birth_bn}</p>
                          )}
                          {voter.profession_bn && voter.profession_bn !== 'N/A' && (
                            <p>পেশা: {voter.profession_bn}</p>
                          )}
                          {voter.address_bn && voter.address_bn !== 'N/A' && (
                            <p>ঠিকানা: {voter.address_bn}</p>
                          )}
                          {voteCenter && <p className="text-blue-600 dark:text-blue-400">কেন্দ্র: {voteCenter}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[730px] max-h-[730px] text-gray-400 text-center p-8 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl min-h-[200px]">
                    <Users size={48} className="mb-3 opacity-20" />
                    <p>{t.noDataYet}</p>
                    <p className="text-sm mt-1">{t.uploadOrLoad}</p>
                  </div>
                )}
              </div>

              {/* Output Settings */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">4</span>
                  {t.step4}
                </h2>
                <div className="flex gap-4">
                  {['A4', 'Legal'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size as PageSize)}
                      className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                        pageSize === size 
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'
                      }`}
                    >
                      {size === 'A4' ? t.a4Paper : t.legalPaper}
                    </button>
                  ))}
                </div>
              </section>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isProcessingGenerate || voters.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                  isProcessingGenerate || voters.length === 0
                    ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed shadow-none text-gray-500'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                }`}
              >
                {isProcessingGenerate ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} /> {t.processing} ({generateTimer}s)
                  </>
                ) : (
                  <>
                    <Download size={20} /> {t.generate}
                  </>
                )}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-auto">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {new Date().getFullYear()} {t.appTitle}. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/shoaibramim" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {toast && (
        <Toast 
          message={toast.msg} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default App;
