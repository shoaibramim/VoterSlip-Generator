import React, { useState } from 'react';
import { Upload, FileText, Check, Square, RectangleVertical } from 'lucide-react';
import { TemplateConfig, AspectRatio } from '../types';

interface Props {
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onTemplateLoaded: (config: TemplateConfig) => void;
  onError: (msg: string) => void;
  clickToUploadText?: string;
  templateMarkersText?: string;
}

export const TemplateUploader: React.FC<Props> = ({ 
  aspectRatio,
  onAspectRatioChange,
  onTemplateLoaded, 
  onError,
  clickToUploadText = 'Click to upload Template',
  templateMarkersText = 'Supports JPG, PNG, or PDF format'
}) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const isImage = fileType.startsWith('image/');
    const isPDF = fileType === 'application/pdf';

    if (!isImage && !isPDF) {
      onError('Please upload a valid JPG, PNG, or PDF file.');
      return;
    }

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      
      // Create template config
      const config: TemplateConfig = {
        file: new Uint8Array(buffer),
        name: file.name,
        fileType: isPDF ? 'pdf' : 'image',
        aspectRatio: aspectRatio,
        width: 0, // Will be calculated based on aspect ratio
        height: 0
      };
      
      setFileName(file.name);
      onTemplateLoaded(config);
    } catch (err) {
      console.error(err);
      onError('Failed to load template file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Aspect Ratio Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Slip Aspect Ratio <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => onAspectRatioChange('1:1')}
            className={`flex-1 py-4 px-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              aspectRatio === '1:1'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <Square size={20} />
            <span>1:1 (Square)</span>
          </button>
          <button
            onClick={() => onAspectRatioChange('3:4')}
            className={`flex-1 py-4 px-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              aspectRatio === '3:4'
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            <RectangleVertical size={20} />
            <span>3:4 (Portrait)</span>
          </button>
        </div>
      </div>

      {/* Template Upload */}
      <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
        <input 
          type="file" 
          id="template-upload" 
          accept="image/jpeg,image/jpg,image/png,application/pdf" 
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
                {loading ? 'Loading...' : clickToUploadText}
              </span>
              <span className="text-xs text-gray-400">
                {templateMarkersText}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Optional - Grey background will be used if not uploaded
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  );
};
