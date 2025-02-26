// src/components/ui/file-upload.tsx

import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, FileText } from 'lucide-react';
import { Document } from '../../types/pipeline';
import { cn } from '../../lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[], type: Document['type']) => void;
  onFileRemove?: (index: number) => void;
  selectedFiles?: File[];
  className?: string;
  documentType?: Document['type'];
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFiles = [],
  className,
  documentType = 'documentation'
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<Document['type']>(documentType);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFileSelect(filesArray, docType);
      // Reset the input value so uploading the same file again works
      e.target.value = '';
    }
  };
  
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col space-y-2">
        <Label htmlFor="documentType">Document Type</Label>
        <select
          id="documentType"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={docType}
          onChange={(e) => setDocType(e.target.value as Document['type'])}
        >
          <option value="estimate">Estimate</option>
          <option value="co">Change Order</option>
          <option value="photo">Photo</option>
          <option value="documentation">Documentation</option>
          <option value="programming">Programming</option>
        </select>
      </div>
      
      <div className="flex items-center gap-4">
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="flex gap-2 items-center"
        >
          <Upload size={16} />
          Upload Files
        </Button>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Files</Label>
          <ul className="space-y-2">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-muted p-2 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                {onFileRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X size={16} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}