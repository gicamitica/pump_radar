/**
 * File Helper Utilities
 * 
 * Shared utilities for file handling across the application.
 * Used by FileUploadZone, AI Chat, and other modules.
 */

/**
 * Generate a unique ID for files
 */
export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format bytes to human-readable string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Convert base64 string to File
 */
export function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string
): File {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mimeType });
}

/**
 * Create object URL for file preview
 */
export function createFilePreview(file: File): string | undefined {
  if (isImageFile(file)) {
    return URL.createObjectURL(file);
  }
  return undefined;
}

/**
 * Revoke object URL to free memory
 */
export function revokeFilePreview(url: string | undefined): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get total size of multiple files
 */
export function getTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number): {
  valid: boolean;
  error?: string;
} {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum (${formatFileSize(maxSize)})`,
    };
  }
  return { valid: true };
}

/**
 * Validate file type by extension
 */
export function validateFileType(
  file: File,
  allowedExtensions: string[]
): {
  valid: boolean;
  error?: string;
} {
  const extension = getFileExtension(file.name);
  
  if (!allowedExtensions.some(ext => ext.toLowerCase() === `.${extension}`)) {
    return {
      valid: false,
      error: `File type .${extension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file by MIME type
 */
export function validateMimeType(
  file: File,
  allowedMimeTypes: string[]
): {
  valid: boolean;
  error?: string;
} {
  // Check for exact match or wildcard match
  const isAllowed = allowedMimeTypes.some((allowedType) => {
    // Exact match
    if (allowedType === file.type) {
      return true;
    }
    
    // Wildcard match (e.g., 'image/*' matches 'image/png')
    if (allowedType.endsWith('/*')) {
      const baseType = allowedType.slice(0, -2); // Remove '/*'
      return file.type.startsWith(baseType + '/');
    }
    
    return false;
  });
  
  if (!isAllowed) {
    return {
      valid: false,
      error: `MIME type ${file.type} is not allowed`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate image dimensions
 */
export async function validateImageDimensions(
  file: File,
  constraints: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!isImageFile(file)) {
    return { valid: true }; // Not an image, skip
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const { width, height } = img;
      
      if (constraints.minWidth && width < constraints.minWidth) {
        resolve({
          valid: false,
          error: `Image width (${width}px) is less than minimum (${constraints.minWidth}px)`,
        });
        return;
      }
      
      if (constraints.minHeight && height < constraints.minHeight) {
        resolve({
          valid: false,
          error: `Image height (${height}px) is less than minimum (${constraints.minHeight}px)`,
        });
        return;
      }
      
      if (constraints.maxWidth && width > constraints.maxWidth) {
        resolve({
          valid: false,
          error: `Image width (${width}px) exceeds maximum (${constraints.maxWidth}px)`,
        });
        return;
      }
      
      if (constraints.maxHeight && height > constraints.maxHeight) {
        resolve({
          valid: false,
          error: `Image height (${height}px) exceeds maximum (${constraints.maxHeight}px)`,
        });
        return;
      }
      
      resolve({ valid: true });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Failed to load image' });
    };
    
    img.src = url;
  });
}

/**
 * Compress image file
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
  } = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg',
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }
          
          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract files from clipboard data
 */
export function extractFilesFromClipboard(clipboardData: DataTransfer): File[] {
  const items = Array.from(clipboardData.items);
  
  return items
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

/**
 * Extract text from clipboard data
 */
export function extractTextFromClipboard(clipboardData: DataTransfer): string | null {
  return clipboardData.getData('text/plain') || null;
}
