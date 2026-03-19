/**
 * useClipboardPaste Hook
 * 
 * Enables paste-from-clipboard functionality for files and text.
 * Perfect for AI Chat, editors, and file upload components.
 * 
 * Features:
 * - Paste images from clipboard
 * - Paste files from clipboard
 * - Paste text from clipboard
 * - Automatic file type detection
 * - Customizable paste handling
 */

import { useEffect, useCallback, useRef } from 'react';
import { extractFilesFromClipboard, extractTextFromClipboard } from '@/shared/utils/fileHelpers';

export interface ClipboardPasteOptions {
  /** Enable file paste */
  enableFiles?: boolean;
  
  /** Enable text paste */
  enableText?: boolean;
  
  /** Callback when files are pasted */
  onFilesPaste?: (files: File[]) => void;
  
  /** Callback when text is pasted */
  onTextPaste?: (text: string) => void;
  
  /** Target element (defaults to document) */
  targetElement?: HTMLElement | null;
  
  /** Prevent default paste behavior */
  preventDefault?: boolean;
  
  /** Only listen when element is focused */
  requireFocus?: boolean;
}

export function useClipboardPaste(options: ClipboardPasteOptions) {
  const {
    enableFiles = true,
    enableText = false,
    onFilesPaste,
    onTextPaste,
    targetElement,
    // @ts-ignore - Used via optionsRef.current in handlePaste
    preventDefault = true,
    // @ts-ignore - Used via optionsRef.current in handlePaste
    requireFocus = false,
  } = options;
  
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const { clipboardData } = event;
    if (!clipboardData) return;
    
    const opts = optionsRef.current;
    
    // Check if target element is focused (if required)
    if (opts.requireFocus && opts.targetElement) {
      if (document.activeElement !== opts.targetElement) {
        return;
      }
    }
    
    // Extract files
    if (opts.enableFiles && opts.onFilesPaste) {
      const files = extractFilesFromClipboard(clipboardData);
      if (files.length > 0) {
        if (opts.preventDefault) {
          event.preventDefault();
        }
        opts.onFilesPaste(files);
        return;
      }
    }
    
    // Extract text
    if (opts.enableText && opts.onTextPaste) {
      const text = extractTextFromClipboard(clipboardData);
      if (text) {
        if (opts.preventDefault) {
          event.preventDefault();
        }
        opts.onTextPaste(text);
        return;
      }
    }
  }, []);
  
  useEffect(() => {
    const target = targetElement || document;
    
    target.addEventListener('paste', handlePaste as EventListener);
    
    return () => {
      target.removeEventListener('paste', handlePaste as EventListener);
    };
  }, [targetElement, handlePaste]);
  
  /**
   * Manually trigger paste (useful for custom paste buttons)
   */
  const triggerPaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        // Handle files
        if (enableFiles && onFilesPaste) {
          const imageTypes = item.types.filter(type => type.startsWith('image/'));
          if (imageTypes.length > 0) {
            const blob = await item.getType(imageTypes[0]);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, {
              type: blob.type,
            });
            onFilesPaste([file]);
            return;
          }
        }
        
        // Handle text
        if (enableText && onTextPaste) {
          if (item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            const text = await blob.text();
            onTextPaste(text);
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read clipboard:', error);
    }
  }, [enableFiles, enableText, onFilesPaste, onTextPaste]);
  
  return {
    triggerPaste,
  };
}
