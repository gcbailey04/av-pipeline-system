// src/lib/fileStorage.ts

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../types/pipeline';

// Base directory for document storage
const STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure the storage directory exists
const ensureStorageDir = () => {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
};

// Get the storage directory for a specific project
const getProjectDir = (projectNumber: string) => {
  const dir = path.join(STORAGE_DIR, projectNumber);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

interface SaveFileOptions {
  file: File;
  projectNumber: string;
  type: Document['type'];
}

export const fileStorage = {
  /**
   * Save a file to local storage
   */
  async saveFile({ file, projectNumber, type }: SaveFileOptions): Promise<Document> {
    ensureStorageDir();
    const projectDir = getProjectDir(projectNumber);
    
    // Create a unique filename
    const fileId = uuidv4();
    const fileExtension = path.extname(file.name);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(projectDir, fileName);
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Write the file
    fs.writeFileSync(filePath, buffer);
    
    // Create and return the document metadata
    const now = new Date();
    const document: Document = {
      id: fileId,
      fileName: file.name,
      path: `/uploads/${projectNumber}/${fileName}`,
      type,
      uploadDate: now,
      lastModified: now
    };
    
    return document;
  },
  
  /**
   * Delete a file from local storage
   */
  deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },
  
  /**
   * Get a list of all documents for a project
   */
  getProjectDocuments(projectNumber: string): string[] {
    const projectDir = path.join(STORAGE_DIR, projectNumber);
    if (!fs.existsSync(projectDir)) {
      return [];
    }
    
    return fs.readdirSync(projectDir);
  }
};