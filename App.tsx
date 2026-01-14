import React, { useState } from 'react';
import { Sun, Moon, Upload, FileText, Download, Users, RefreshCw, MapPin, Building, Languages } from 'lucide-react';
import { extractVotersFromPDF, generatePDF } from './services/pdfProcessor';
import { setBengaliFont } from './services/fontLoader';
import { Toast } from './components/ui/Toast';
import { TemplateUploader } from './components/TemplateUploader';
import { VoterData, TemplateConfig, PageSize } from './types';
import { translations, Language } from './i18n/translations';

// Mock data for demo purposes - Always in Bengali
const MOCK_VOTERS: VoterData[] = [
  {
    id: '1',
    serial_no: '০০১',
    voter_name_bn: 'আবদুর রহিম',
    voter_no_bd: '১৯৮৭৬৫৪৩২১০০১',
    father_name_bn: 'করিম শেখ',
    mother_name_bn: 'রাহেলা বেগম',
    date_of_birth_bn: '০১-০১-১৯৮০',
    profession_bn: 'কৃষক',
    address_bn: 'গ্রাম: সোনাতলা, পোস্ট: বগুড়া'
  },
  {
    id: '2',
    serial_no: '০০২',
    voter_name_bn: 'ফাতেমা খাতুন',
    voter_no_bd: '১৯৯০১২৩৪৫৬০০২',
    father_name_bn: 'স্বর্গীয় আবদুল জব্বার',
    mother_name_bn: 'নূরজাহান বিবি',
    date_of_birth_bn: '১৫-০৫-১৯৯০',
    profession_bn: 'গৃহিণী',
    address_bn: 'গ্রাম: সোনাতলা, পোস্ট: বগুড়া'
  },
  {
    id: '3',
    serial_no: '০০৩',
    voter_name_bn: 'মো. রফিকুল ইসলাম',
    voter_no_bd: '১৯৮৫৪৪৩৩২২০০৩',
    father_name_bn: 'আজিজুর রহমান',
    mother_name_bn: 'সালেহা খাতুন',
    date_of_birth_bn: '১০-১০-১৯৮৫',
    profession_bn: 'শিক্ষক',
    address_bn: 'গ্রাম: ধুনট, পোস্ট: শেরপুর'
  },
  {
    id: '4',
    serial_no: '০০৪',
    voter_name_bn: 'মোসাম্মৎ আয়েশা',
    voter_no_bd: '২০০০৭৭৮৮৯৯০০৪',
    father_name_bn: 'আবুল কালাম',
    mother_name_bn: 'ফরিদা ইয়াসমিন',
    date_of_birth_bn: '২০-১২-২০০০',
    profession_bn: 'শিক্ষার্থী',
    address_bn: 'গ্রাম: ধুনট, পোস্ট: শেরপুর'
  }
];

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // New State for additional info
  const [voteCenter, setVoteCenter] = useState('');
  const [voterArea, setVoterArea] = useState('');
  const [benhaliFontLoaded, setBengaliFontLoaded] = useState(false);
  const [selectedVoterFile, setSelectedVoterFile] = useState<File | null>(null);

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

  // Handle Bengali Font Upload (Optional)
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(ttf|otf)$/i)) {
      showToast(t.invalidFontFile, "error");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      setBengaliFont(buffer);
      setBengaliFontLoaded(true);
      showToast(t.bengaliFontSuccess);
    } catch (err) {
      console.error(err);
      showToast(t.fontLoadFailed, "error");
    }
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

    setIsProcessing(true);
    try {
      const buffer = await selectedVoterFile.arrayBuffer();
      const extracted = await extractVotersFromPDF(buffer);
      
      if (extracted.length > 0) {
        setVoters(extracted);
        showToast(`${extracted.length} ${t.votersExtracted}`);
      } else {
        showToast(t.noStructuredData, "error");
      }
    } catch (err) {
      console.error(err);
      showToast(t.errorReadingPdf, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadMockData = () => {
    setVoters([...MOCK_VOTERS, ...MOCK_VOTERS, ...MOCK_VOTERS]); // Load 12 items to show multiple pages
    showToast(t.sampleDataLoaded);
    // Pre-fill with Bengali data for better demo
    setVoteCenter('সোনাতলা উচ্চ বিদ্যালয়');
    setVoterArea('ওয়ার্ড নং ৫');
  };

  // Step 3: Generate PDF
  const handleGenerate = async () => {
    if (voters.length === 0) {
      showToast(t.noVoterData, "error");
      return;
    }

    // Vote Center and Voter Area are optional - use empty string if not provided
    setIsProcessing(true);
    try {
      const pdfBytes = await generatePDF(
        voters, 
        template, 
        pageSize,
        { voteCenter, voterArea }
      );
      
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
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('Bengali font is required')) {
        showToast(t.benhaliFontRequired, "error");
      } else {
        showToast(t.pdfGenerationFailed, "error");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setVoters([]);
    setTemplate(null);
    setVoteCenter('');
    setVoterArea('');
    setBengaliFont(null);
    setBengaliFontLoaded(false);
    setSelectedVoterFile(null);
    showToast(t.allDataCleared);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-slate-950 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
        <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
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
                   <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors relative">
                    <input 
                      type="file" 
                      id="voter-upload" 
                      accept="application/pdf" 
                      className="hidden" 
                      onChange={handleVoterListFileSelect}
                      disabled={isProcessing}
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
                    {isProcessing && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-xl">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {selectedVoterFile && (
                    <button 
                      onClick={handleVoterListUpload}
                      disabled={isProcessing}
                      className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isProcessing ? t.processing || 'Processing...' : t.uploadButton || 'Upload & Process'}
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

                  <button 
                    onClick={loadMockData}
                    className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {t.loadSampleData}
                  </button>
                </div>
              </section>

               {/* Step 2: Global Info (NEW) */}
               <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                 <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                    {t.step2}
                  </h2>
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
              {/* Step 2.5: Bengali Font (Optional) */}
              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">2.5</span>
                    {t.step2_5}
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-gray-500">
                    {t.optional}
                  </span>
                </div>
                
                {!benhaliFontLoaded ? (
                  <div className="mb-4 p-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">{t.usingDefaultFont}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      {t.defaultFontDesc}
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{t.bengaliFontLoaded}</p>
                    <button 
                      onClick={() => {
                        setBengaliFont(null);
                        setBengaliFontLoaded(false);
                        showToast(t.fontCleared);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 underline mt-1"
                    >
                      {t.clearFont}
                    </button>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input 
                    type="file" 
                    id="font-upload" 
                    accept=".ttf,.otf" 
                    className="hidden" 
                    onChange={handleFontUpload}
                  />
                  <label htmlFor="font-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <FileText size={32} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t.uploadBengaliFont}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t.fontRecommendation}
                    </span>
                  </label>
                </div>
              </section>
              {/* Step 3: Template (Modified) */}
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
                         {t.placeholderSupport} <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{"{{vote_center}}"}</code>, <code className="bg-gray-100 dark:bg-slate-800 px-1 rounded">{"{{voter_area}}"}</code>
                      </div>
                    </div>
                  )}

                  <TemplateUploader 
                    onTemplateLoaded={setTemplate} 
                    onError={(msg) => showToast(msg, 'error')}
                    clickToUploadText={t.clickToUpload}
                    templateMarkersText={t.templateMarkers}
                  />
              </section>

               {/* Step 4: Config */}
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
            </div>

            {/* Right Column: Preview & Action */}
            <div className="flex flex-col gap-6">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 flex-1 flex flex-col min-h-[400px]">
                <h2 className="text-lg font-semibold mb-4">{t.dataPreview}</h2>
                
                {voters.length > 0 ? (
                  <div className="flex-1 overflow-auto max-h-[500px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
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
                          <p>{t.father} {voter.father_name_bn}</p>
                          <p>{t.mother} {voter.mother_name_bn}</p>
                          {voteCenter && <p className="text-blue-600 dark:text-blue-400">{t.center} {voteCenter}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-8 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl">
                    <Users size={48} className="mb-3 opacity-20" />
                    <p>{t.noDataYet}</p>
                    <p className="text-sm mt-1">{t.uploadOrLoad}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isProcessing || voters.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                  isProcessing || voters.length === 0
                    ? 'bg-gray-300 dark:bg-slate-800 cursor-not-allowed shadow-none text-gray-500'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} /> {t.processing}
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
