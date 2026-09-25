'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';

interface AdminImagePreviewProps {
  url?: string;
  file?: File | null;
  onRemove: () => void;
  isPrimary?: boolean;
  label?: string;
  circular?: boolean;
  className?: string;
}

export default function AdminImagePreview({ url, file, onRemove, isPrimary, label, circular, className = "" }: AdminImagePreviewProps) {
  const [dimensions, setDimensions] = useState<string>('');
  
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl('');
    }
  }, [file]);

  const displayUrl = objectUrl || url;
  const isNew = !!file;
  const sizeKb = file ? (file.size / 1024).toFixed(1) : null;

  if (!displayUrl) return null;

  return (
    <div className={`flex flex-col gap-1.5 group ${circular ? 'items-center' : 'w-full'} ${className}`}>
      <div className={`relative overflow-hidden border-2 ${isNew ? 'border-[#C5A059]' : 'border-[#E2DBD0]'} ${circular ? 'rounded-full aspect-square w-20 h-20 shrink-0' : 'rounded-xl w-full aspect-square'}`}>
        <img
          src={displayUrl}
          alt="Preview"
          className="w-full h-full object-cover bg-[#FAF8F5]"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setDimensions(`${img.naturalWidth} × ${img.naturalHeight}`);
          }}
        />
        {isPrimary && !circular && (
          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-white bg-[#C5A059] text-[9px] font-bold shadow-sm">
            Primary
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          type="button"
          className={`absolute ${circular ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-1.5 right-1.5 p-1.5'} rounded-full bg-white/90 hover:bg-white shadow-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center`}
        >
          {circular ? <X className="w-5 h-5 text-rose-600" /> : <X className="w-3.5 h-3.5 text-[#0B241C]" />}
        </button>
      </div>
      
      {!circular && (
        <div className="flex flex-col px-1 w-full overflow-hidden">
          <div className="flex items-center gap-1.5 w-full">
            <span className={`text-[11px] font-bold truncate ${isNew ? 'text-[#C5A059]' : 'text-[#0B241C]'}`} title={file ? file.name : 'Uploaded Image'}>
              {label ? `${label}: ` : ''}{isNew ? file.name : 'Uploaded Image'}
            </span>
          </div>
          
          <div className="text-[#5A7469] text-[10px] font-medium flex items-center gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            {isNew && <span>{sizeKb} KB</span>}
            {isNew && dimensions && <span className="w-1 h-1 rounded-full bg-[#E2DBD0] shrink-0" />}
            {dimensions ? (
              <span>{dimensions}</span>
            ) : (
              <span className="opacity-0">Loading...</span>
            )}
          </div>
        </div>
      )}
      
      {circular && (
        <div className="text-center mt-1">
          <div className="text-[#0B241C] text-[10px] font-bold">
            {isNew ? 'New Upload' : 'Current'}
          </div>
          <div className="text-[#5A7469] text-[9px] font-medium leading-tight">
            {isNew && <div>{sizeKb} KB</div>}
            {dimensions && <div>{dimensions}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
