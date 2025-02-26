// lib/storage/localFileStorage.ts

import fs from 'fs/promises';
import path from 'path';

export class LocalFileStorage {
  private baseDir: string;

  constructor() {
    // Store files in a 'data' directory at the project root
    this.baseDir = path.join(process.cwd(), 'data');
  }

  async initialize() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to initialize storage directory:', error);
      throw error;
    }
  }

  async createCustomerDirectory(customerName: string, projectNumber: string) {
    const customerPath = path.join(this.baseDir, customerName);
    const projectPath = path.join(customerPath, projectNumber);
    const subDirs = [
      'Job Documentation/As-Built Documentation',
      'Job Documentation/Pre-Installation Photos',
      'Job Documentation/Programming Files',
      'Job Documentation/Progress Photos',
      'Sales Docs',
      'Signed COs',
      'Signed Original Estimate'
    ];

    try {
      // Create customer directory
      await fs.mkdir(customerPath, { recursive: true });
      
      // Create project directory
      await fs.mkdir(projectPath, { recursive: true });
      
      // Create all subdirectories
      for (const dir of subDirs) {
        await fs.mkdir(path.join(projectPath, dir), { recursive: true });
      }

      return projectPath;
    } catch (error) {
      console.error('Failed to create directory structure:', error);
      throw error;
    }
  }

  async saveFile(
    customerName: string,
    projectNumber: string,
    fileCategory: string,
    file: Express.Multer.File
  ) {
    try {
      const projectPath = path.join(this.baseDir, customerName, projectNumber);
      const categoryPath = path.join(projectPath, fileCategory);
      
      // Ensure directory exists
      await fs.mkdir(categoryPath, { recursive: true });
      
      // Generate unique filename
      const timestamp = new Date().getTime();
      const filename = `${timestamp}-${file.originalname}`;
      const filePath = path.join(categoryPath, filename);
      
      // Save file
      await fs.writeFile(filePath, file.buffer);
      
      return {
        path: filePath,
        filename: filename
      };
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
  }

  async getFile(filePath: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      const file = await fs.readFile(fullPath);
      return file;
    } catch (error) {
      console.error('Failed to get file:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string) {
    try {
      const fullPath = path.join(this.baseDir, filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  async listFiles(customerName: string, projectNumber: string, category?: string) {
    try {
      const basePath = path.join(this.baseDir, customerName, projectNumber);
      const searchPath = category ? path.join(basePath, category) : basePath;
      
      const files = await fs.readdir(searchPath, { withFileTypes: true });
      
      return files.filter(file => file.isFile()).map(file => ({
        name: file.name,
        path: path.relative(this.baseDir, path.join(searchPath, file.name))
      }));
    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }
}