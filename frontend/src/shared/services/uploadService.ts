/**
 * Upload Service
 * 
 * Handles file uploads with progress tracking, retry logic, and error handling.
 * Used by useFileUpload hook and can be used standalone.
 */

import type { UploadOptions, UploadResult } from '@/shared/types/fileUpload.types';

export class UploadService {
  /**
   * Upload a single file with progress tracking
   */
  async uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options.onProgress) {
          const progress = (e.loaded / e.total) * 100;
          options.onProgress(progress);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              data,
              url: data.url || data.fileUrl || data.path,
            });
          } catch {
            // Response is not JSON
            resolve({
              success: true,
              data: xhr.responseText,
            });
          }
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error occurred',
        });
      });
      
      // Handle abort
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload cancelled',
        });
      });
      
      // Setup abort signal
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
      
      // Prepare request
      const formData = new FormData();
      formData.append(options.fieldName || 'file', file);
      
      // Add additional fields
      if (options.additionalFields) {
        Object.entries(options.additionalFields).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }
      
      xhr.open(options.method || 'POST', options.url);
      
      // Set headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      
      xhr.send(formData);
    });
  }
  
  /**
   * Upload multiple files sequentially
   */
  async uploadFilesSequential(
    files: File[],
    options: Omit<UploadOptions, 'onProgress'> & {
      onFileProgress?: (fileIndex: number, progress: number) => void;
      onOverallProgress?: (progress: number) => void;
    }
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], {
        ...options,
        onProgress: (progress) => {
          options.onFileProgress?.(i, progress);
          
          // Calculate overall progress
          const overallProgress = ((i + progress / 100) / files.length) * 100;
          options.onOverallProgress?.(overallProgress);
        },
      });
      
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Upload multiple files in parallel with concurrency limit
   */
  async uploadFilesParallel(
    files: File[],
    options: Omit<UploadOptions, 'onProgress'> & {
      concurrency?: number;
      onFileComplete?: (fileIndex: number, result: UploadResult) => void;
    }
  ): Promise<UploadResult[]> {
    const concurrency = options.concurrency || 3;
    const results: UploadResult[] = new Array(files.length);
    let currentIndex = 0;
    
    const uploadNext = async (): Promise<void> => {
      const index = currentIndex++;
      if (index >= files.length) return;
      
      const result = await this.uploadFile(files[index], options);
      results[index] = result;
      options.onFileComplete?.(index, result);
      
      await uploadNext();
    };
    
    // Start concurrent uploads
    await Promise.all(
      Array.from({ length: Math.min(concurrency, files.length) }, () =>
        uploadNext()
      )
    );
    
    return results;
  }
}

// Singleton instance
export const uploadService = new UploadService();
