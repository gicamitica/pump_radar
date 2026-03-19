/**
 * File Upload Types
 * 
 * Shared TypeScript types for file upload functionality
 */

import type { Accept } from 'react-dropzone';

export interface UploadedFile {
  /** Unique identifier */
  id: string;
  
  /** The actual File object */
  file: File;
  
  /** Object URL for preview (images only) */
  preview?: string;
  
  /** Upload progress (0-100) */
  progress: number;
  
  /** Upload status */
  status: 'pending' | 'uploading' | 'complete' | 'error';
  
  /** Error message if status is 'error' */
  error?: string;
  
  /** URL of uploaded file (after successful upload) */
  uploadedUrl?: string;
  
  /** Number of retry attempts */
  retries: number;
  
  /** AbortController for cancellation */
  abortController?: AbortController;
}

export interface UploadResult {
  /** Whether upload was successful */
  success: boolean;
  
  /** URL of uploaded file */
  url?: string;
  
  /** Additional data from server */
  data?: any;
  
  /** Error message if failed */
  error?: string;
}

export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Error message if validation failed */
  error?: string;
}

export interface UploadOptions {
  /** Upload endpoint URL */
  url: string;
  
  /** HTTP method */
  method?: 'POST' | 'PUT';
  
  /** Additional headers */
  headers?: Record<string, string>;
  
  /** Progress callback */
  onProgress?: (progress: number) => void;
  
  /** Abort signal */
  signal?: AbortSignal;
  
  /** Field name for the file */
  fieldName?: string;
  
  /** Additional form fields */
  additionalFields?: Record<string, string | number | boolean>;
}

export interface FileUploadHookOptions {
  /** Upload endpoint URL */
  uploadUrl?: string;
  
  /** HTTP method */
  uploadMethod?: 'POST' | 'PUT';
  
  /** Additional headers */
  uploadHeaders?: Record<string, string>;
  
  /** Custom upload handler */
  onUpload?: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<UploadResult>;
  
  /** Callback when upload completes */
  onUploadComplete?: (file: UploadedFile, result: UploadResult) => void;
  
  /** Callback when upload fails */
  onUploadError?: (file: UploadedFile, error: string) => void;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Auto-upload files when added */
  autoUpload?: boolean;
  
  /** Compress images before upload */
  compressImages?: boolean;
  
  /** Image compression quality (0-1) */
  compressionQuality?: number;
  
  /** Max image dimensions for compression */
  maxImageWidth?: number;
  maxImageHeight?: number;
}

export interface FileUploadZoneProps {
  // File constraints
  /** Accepted file types (MIME types) */
  accept?: Accept;
  
  /** Maximum file size in bytes */
  maxSize?: number;
  
  /** Maximum number of files */
  maxFiles?: number;
  
  /** Allow multiple files */
  multiple?: boolean;
  
  // Upload configuration
  /** Upload endpoint URL */
  uploadUrl?: string;
  
  /** HTTP method */
  uploadMethod?: 'POST' | 'PUT';
  
  /** Additional headers */
  uploadHeaders?: Record<string, string>;
  
  /** Auto-upload files when added */
  autoUpload?: boolean;
  
  // Controlled mode
  /** Controlled value */
  value?: UploadedFile[];
  
  /** Controlled onChange */
  onChange?: (files: UploadedFile[]) => void;
  
  // Callbacks
  /** Custom upload handler */
  onUpload?: (
    file: File,
    onProgress: (progress: number) => void
  ) => Promise<UploadResult>;
  
  /** Callback when files are added/changed */
  onFilesChange?: (files: UploadedFile[]) => void;
  
  /** Callback when upload completes */
  onUploadComplete?: (file: UploadedFile, result: UploadResult) => void;
  
  /** Callback when upload fails */
  onUploadError?: (file: UploadedFile, error: string) => void;
  
  /** Callback when a file is removed */
  onFileRemove?: (fileId: string) => void;
  
  /** Callback when validation fails */
  onValidationError?: (file: File, error: string) => void;
  
  // Validation
  /** Custom validation function */
  validateFile?: (file: File) => Promise<ValidationResult>;
  
  /** Validate image dimensions */
  validateImageDimensions?: boolean;
  
  /** Max image width */
  maxImageWidth?: number;
  
  /** Max image height */
  maxImageHeight?: number;
  
  // UI customization
  /** Custom label */
  label?: string;
  
  /** Custom description */
  description?: string;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Additional class name */
  className?: string;
  
  /** Compact mode */
  compact?: boolean;
  
  /** Show file previews */
  showPreview?: boolean;
  
  // Advanced features
  /** Enable retry mechanism */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Compress images before upload */
  compressImages?: boolean;
  
  /** Image compression quality (0-1) */
  compressionQuality?: number;
  
  /** Enable paste from clipboard */
  enablePaste?: boolean;

  /** Whether the field is required (visual only) */
  isRequired?: boolean;
}
