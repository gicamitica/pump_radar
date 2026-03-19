/**
 * FileUploadZone - Production-ready file upload component
 * 
 * Features:
 * - Real HTTP upload with progress tracking
 * - Automatic retry with exponential backoff
 * - Upload cancellation
 * - Clipboard paste support
 * - Image compression
 * - Memory leak prevention
 * - Controlled/uncontrolled modes
 * - Suitable for forms, AI Chat, and any file upload scenario
 */

import { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { cn } from '@/shadcn/lib/utils';
import { Upload, X, AlertCircle, Check, RotateCw, Loader2, Clipboard } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import { Progress } from '@/shared/ui/shadcn/components/ui/progress';

import { useFileUpload } from '@/shared/hooks/useFileUpload';
import { useClipboardPaste } from '@/shared/hooks/useClipboardPaste';
import type { FileUploadZoneProps, UploadedFile, ValidationResult } from '@/shared/types/fileUpload.types';
import { formatFileSize, validateFileSize, validateMimeType, validateImageDimensions } from '@/shared/utils/fileHelpers';
import { getFileIcon } from '@/shared/ui/components/files/FileIcon';

// Re-export types for backward compatibility
export type { UploadedFile, FileUploadZoneProps };

export function FileUploadZone(props: FileUploadZoneProps) {
  const {
    // File constraints
    accept,
    maxSize = 10 * 1024 * 1024,
    maxFiles = 5,
    multiple = true,
    
    // Upload configuration
    uploadUrl,
    uploadMethod,
    uploadHeaders,
    autoUpload = false,
    
    // Controlled mode
    value,
    onChange,
    
    // Callbacks
    onUpload,
    onFilesChange,
    onUploadComplete,
    onUploadError,
    onFileRemove,
    onValidationError,
    
    // Validation
    validateFile: customValidate,
    validateImageDimensions: shouldValidateImageDimensions,
    maxImageWidth,
    maxImageHeight,
    
    // UI
    label = 'Upload files',
    description = 'Drag & drop files here, or click to select',
    disabled = false,
    error: externalError,
    className,
    compact = false,
    showPreview = true,
    
    // Advanced
    enableRetry = true,
    maxRetries = 3,
    compressImages = false,
    compressionQuality = 0.8,
    enablePaste = false,
    isRequired,
  } = props;
  
  // Determine if controlled
  const isControlled = value !== undefined;
  
  // Use upload hook for uncontrolled mode
  const uploadHook = useFileUpload({
    uploadUrl,
    uploadMethod,
    uploadHeaders,
    onUpload,
    onUploadComplete,
    onUploadError,
    maxRetries: enableRetry ? maxRetries : 0,
    autoUpload,
    compressImages,
    compressionQuality,
    maxImageWidth,
    maxImageHeight,
  });
  
  // Use controlled or uncontrolled files
  const files = isControlled ? value : uploadHook.files;
  const setFiles = isControlled ? onChange : undefined;
  
  // Validate a file
  const validateFileInternal = useCallback(
    async (file: File): Promise<ValidationResult> => {
      // Size validation
      if (maxSize) {
        const result = validateFileSize(file, maxSize);
        if (!result.valid) return result;
      }
      
      // MIME type validation
      if (accept) {
        const allowedMimeTypes = Object.keys(accept);
        const result = validateMimeType(file, allowedMimeTypes);
        if (!result.valid) return result;
      }
      
      // Image dimensions validation
      if (shouldValidateImageDimensions && (maxImageWidth || maxImageHeight)) {
        const result = await validateImageDimensions(file, {
          maxWidth: maxImageWidth,
          maxHeight: maxImageHeight,
        });
        if (!result.valid) return result;
      }
      
      // Custom validation
      if (customValidate) {
        const result = await customValidate(file);
        if (!result.valid) return result;
      }
      
      return { valid: true };
    },
    [maxSize, accept, shouldValidateImageDimensions, maxImageWidth, maxImageHeight, customValidate]
  );
  
  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      // Handle rejections
      if (rejections.length > 0) {
        const firstError = rejections[0].errors[0];
        let errorMessage = firstError.message;
        
        if (firstError.code === 'file-too-large') {
          errorMessage = `File is too large. Maximum size is ${formatFileSize(maxSize)}`;
        } else if (firstError.code === 'file-invalid-type') {
          errorMessage = 'Invalid file type';
        } else if (firstError.code === 'too-many-files') {
          errorMessage = `Maximum ${maxFiles} files allowed`;
        }
        
        onValidationError?.(rejections[0].file, errorMessage);
        return;
      }
      
      // Validate files
      for (const file of acceptedFiles) {
        const result = await validateFileInternal(file);
        if (!result.valid) {
          onValidationError?.(file, result.error || 'Validation failed');
          return;
        }
      }
      
      // Add files
      if (isControlled) {
        // Controlled mode: create UploadedFile objects and call onChange
        const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          progress: 0,
          status: 'pending',
          retries: 0,
        }));
        
        const updated = [...files, ...newFiles].slice(0, maxFiles);
        setFiles?.(updated);
        onFilesChange?.(updated);
      } else {
        // Uncontrolled mode: use hook
        // addFiles returns the newly added files and updates hook's internal state
        const addedFiles = uploadHook.addFiles(acceptedFiles);
        // Combine current files with newly added ones for the callback
        const allFiles = [...files, ...addedFiles];
        onFilesChange?.(allFiles);
      }
    },
    [
      maxSize,
      maxFiles,
      validateFileInternal,
      onValidationError,
      isControlled,
      files,
      setFiles,
      onFilesChange,
      uploadHook,
    ]
  );
  
  // Handle file removal
  const removeFile = useCallback(
    (fileId: string) => {
      if (isControlled) {
        const file = files.find((f) => f.id === fileId);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        const updated = files.filter((f) => f.id !== fileId);
        setFiles?.(updated);
        onFilesChange?.(updated);
      } else {
        uploadHook.removeFile(fileId);
      }
      
      onFileRemove?.(fileId);
    },
    [isControlled, files, setFiles, onFilesChange, uploadHook, onFileRemove]
  );
  
  // Clipboard paste support
  useClipboardPaste({
    enableFiles: enablePaste,
    onFilesPaste: (pastedFiles) => {
      onDrop(pastedFiles, []);
    },
  });
  
  // Dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: multiple ? maxFiles - files.length : 1,
    multiple,
    disabled: disabled || files.length >= maxFiles,
  });
  
  return (
    <div className={cn('space-y-4', className)} data-testid="file-upload-zone">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
          'flex flex-col items-center justify-center text-center',
          compact ? 'p-4' : 'p-8',
          isDragActive && !isDragReject && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          externalError && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragActive &&
            !externalError &&
            'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
        )}
        data-testid="file-upload-dropzone"
      >
        <input {...getInputProps()} />
        
        <div className={cn('flex flex-col items-center gap-2', compact && 'gap-1')}>
          <div
            className={cn(
              'rounded-full p-3 bg-muted/50',
              isDragActive && 'bg-primary/10',
              compact && 'p-2'
            )}
          >
            <Upload
              className={cn(
                'h-6 w-6 text-muted-foreground',
                isDragActive && 'text-primary',
                compact && 'h-4 w-4'
              )}
            />
          </div>
          
          <div className="space-y-1">
            <p className={cn('font-medium text-foreground', compact && 'text-sm')}>
              {isDragActive ? 'Drop files here' : (
                <span>
                  {label}
                  {isRequired && <span className="text-destructive ml-1">*</span>}
                </span>
              )}
            </p>
            {!compact && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {accept && !compact && (
              <p className="text-xs text-muted-foreground/70">
                {Object.keys(accept).join(', ')} • Max {formatFileSize(maxSize)}
              </p>
            )}
            {enablePaste && !compact && (
              <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
                <Clipboard className="h-3 w-3" />
                Paste supported
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {externalError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {externalError}
        </div>
      )}
      
      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <FileItem
              key={uploadedFile.id}
              file={uploadedFile}
              showPreview={showPreview}
              onRemove={() => removeFile(uploadedFile.id)}
              onRetry={
                enableRetry && !isControlled
                  ? () => uploadHook.retryFile(uploadedFile.id)
                  : undefined
              }
              onCancel={
                !isControlled
                  ? () => uploadHook.cancelUpload(uploadedFile.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Sub-component: FileItem
interface FileItemProps {
  file: UploadedFile;
  showPreview: boolean;
  onRemove: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

function FileItem({ file, showPreview, onRemove, onRetry, onCancel }: FileItemProps) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
      data-testid={`uploaded-file-${file.id}`}
    >
      {/* Preview or Icon */}
      {showPreview && file.preview ? (
        <img
          src={file.preview}
          alt={file.file.name}
          className="h-10 w-10 rounded object-cover"
        />
      ) : (
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
          {getFileIcon(file.file)}
        </div>
      )}
      
      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file.size)}
          {file.status === 'error' && file.error && (
            <span className="text-destructive ml-2">• {file.error}</span>
          )}
          {file.retries > 0 && file.status !== 'error' && (
            <span className="text-muted-foreground ml-2">• Retry {file.retries}</span>
          )}
        </p>
        
        {/* Progress Bar */}
        {file.status === 'uploading' && (
          <Progress value={file.progress} className="h-1 mt-2" />
        )}
      </div>
      
      {/* Status / Actions */}
      <div className="flex items-center gap-2">
        {file.status === 'uploading' && (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={onCancel}
                title="Cancel upload"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {file.status === 'complete' && (
          <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-green-500" />
          </div>
        )}
        
        {file.status === 'error' && onRetry && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRetry}
            title="Retry upload"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}
        
        {file.status === 'error' && (
          <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          </div>
        )}
        
        {file.status !== 'uploading' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onRemove}
            title="Remove file"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default FileUploadZone;
