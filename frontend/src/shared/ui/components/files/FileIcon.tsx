/**
 * File Icon Component
 * 
 * Returns appropriate icon for different file types
 */

import { FileIcon, ImageIcon, FileText, Film, Music, Archive, Code } from 'lucide-react';

interface FileIconProps {
  file: File;
  className?: string;
}

export function getFileIcon(file: File) {
  const type = file.type;
  const name = file.name.toLowerCase();
  
  // Images
  if (type.startsWith('image/')) {
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  }
  
  // PDFs
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  
  // Videos
  if (type.startsWith('video/')) {
    return <Film className="h-5 w-5 text-purple-500" />;
  }
  
  // Audio
  if (type.startsWith('audio/')) {
    return <Music className="h-5 w-5 text-green-500" />;
  }
  
  // Archives
  if (
    type === 'application/zip' ||
    type === 'application/x-rar-compressed' ||
    name.endsWith('.zip') ||
    name.endsWith('.rar') ||
    name.endsWith('.7z')
  ) {
    return <Archive className="h-5 w-5 text-yellow-500" />;
  }
  
  // Code files
  if (
    name.endsWith('.js') ||
    name.endsWith('.ts') ||
    name.endsWith('.jsx') ||
    name.endsWith('.tsx') ||
    name.endsWith('.py') ||
    name.endsWith('.java') ||
    name.endsWith('.cpp') ||
    name.endsWith('.c') ||
    name.endsWith('.css') ||
    name.endsWith('.html')
  ) {
    return <Code className="h-5 w-5 text-indigo-500" />;
  }
  
  // Documents
  if (
    type.includes('word') ||
    type.includes('document') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  ) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  }
  
  // Default
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
}

export function FileIconComponent({ file, className }: FileIconProps) {
  const icon = getFileIcon(file);
  
  if (className) {
    // Clone the icon with custom className
    return <span className={className}>{icon}</span>;
  }
  
  return icon;
}
