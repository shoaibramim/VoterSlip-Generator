import React, { useState } from 'react';
import { Upload, FileText, Check } from 'lucide-react';
import { analyzeTemplate } from '../services/pdfProcessor';
import { TemplateConfig } from '../types';

interface Props {
  onTemplateLoaded: (config: TemplateConfig) => void;
  onError: (msg: string) => void;
  clickToUploadText?: string;
  templateMarkersText?: string;
}

export const TemplateUploader: React.FC<Props> = ({ 
  onTemplateLoaded, 
  onError,
  clickToUploadText = 'Click to upload PDF Template',
  templateMarkersText = 'Must contain markers like {{NAME}}, {{SERIAL}}'
}) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      onError('Please upload a valid PDF template.');
      return;
    }

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const config = await analyzeTemplate(buffer);
      setFileName(file.name);
      
      // If no placeholders found, warn user but still proceed (might simply overlay at default positions in a real app)
      const keys = Object.keys(config.mappings);
      if (keys.length === 0) {
        onError('Warning: No {{PLACEHOLDER}} tokens found in this PDF. Text might not appear.');
      } else {
        // Just for debug/info
        console.log('Found placeholders:', keys);
      }
      
      onTemplateLoaded(config);
    } catch (err) {
      console.error(err);
      onError('Failed to parse template PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <input 
        type="file" 
        id="template-upload" 
        accept="application/pdf" 
        className="hidden" 
        onChange={handleFileChange}
      />
      <label htmlFor="template-upload" className="cursor-pointer flex flex-col items-center gap-2">
        {fileName ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check size={32} />
            <span className="font-medium">{fileName}</span>
          </div>
        ) : (
          <>
            <FileText size={32} className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {loading ? 'Analyzing...' : clickToUploadText}
            </span>
            <span className="text-xs text-gray-400">
              {templateMarkersText}
            </span>
          </>
        )}
      </label>
    </div>
  );
};
