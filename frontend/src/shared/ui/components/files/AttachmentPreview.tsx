import React from 'react';
import { 
  Paperclip, 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Link as LinkIcon 
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import type { Attachment } from '@/shared/types/attachment.types';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  /** Mode of display: 'grid' for thumbnails, 'list' for vertical list with details */
  variant?: 'grid' | 'list';
  /** Optional removal handler. If not provided, remove button is hidden (readonly mode) */
  onRemove?: (id: string) => void;
  /** Optional download handler */
  onDownload?: (attachment: Attachment) => void;
  /** Optional view handler */
  onView?: (attachment: Attachment) => void;
  /** Grid mode: size of thumbnails */
  compact?: boolean;
  className?: string;
}

const getFileIcon = (type: string | undefined) => {
  const normalizedType = type?.toLowerCase() || '';
  if (normalizedType.includes('image')) return ImageIcon;
  if (normalizedType.includes('video')) return Video;
  if (normalizedType.includes('audio') || normalizedType.includes('voice')) return Music;
  if (normalizedType.includes('link')) return LinkIcon;
  if (normalizedType.includes('pdf') || normalizedType.includes('document')) return FileText;
  return Paperclip;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * AttachmentPreview - A versatile shared component for displaying attachments.
 * Supports both Grid (composer style) and List (inbox/message detail style) layouts.
 */
export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ 
  attachments, 
  variant = 'grid',
  onRemove, 
  onDownload,
  onView,
  compact = false,
  className 
}) => {
  if (attachments.length === 0) return null;

  if (variant === 'list') {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3", className)}>
        {attachments.map((att) => {
          const Icon = getFileIcon(att.type);
          return (
            <div
              key={att.id}
              className="group flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="relative h-10 w-10 shrink-0">
                {(att.thumbnail || att.preview || att.type === 'image' || att.type?.startsWith('image/')) ? (
                  <img
                    src={att.thumbnail || att.preview || att.url}
                    alt={att.name || ''}
                    className="h-full w-full rounded-xl object-cover border bg-background"
                  />
                ) : (
                  <div className="h-full w-full rounded-xl bg-muted group-hover:bg-primary/5 flex items-center justify-center border text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0" onClick={() => onView?.(att)}>
                <p className={cn(
                  "text-[11px] font-bold truncate leading-tight group-hover:text-primary transition-colors",
                )}>
                  {att.name || 'Untitled File'}
                </p>
                {att.size && (
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">
                    {formatFileSize(att.size)}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-0.5 ml-auto">
                {onDownload && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDownload(att)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onRemove && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="shrink-0 h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(att.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Default 'grid' variant (Composer style)
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {attachments.map((att) => {
        const Icon = getFileIcon(att.type);
        return (
          <div 
            key={att.id} 
            className={cn(
              "relative group",
              compact ? "size-12" : "size-16"
            )}
          >
            <div 
              className={cn(
                "size-full rounded-xl border bg-muted flex items-center justify-center overflow-hidden shadow-sm transition-transform group-hover:scale-[1.02]",
                compact && "rounded-lg",
                onView && "cursor-pointer"
              )}
              onClick={() => onView?.(att)}
            >
              {(att.thumbnail || att.preview || att.type === 'image' || att.type?.startsWith('image/')) ? (
                <img src={att.thumbnail || att.preview || att.url} alt="" className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center bg-muted-foreground/10">
                  <Icon className={cn(compact ? "size-4" : "size-6", "text-muted-foreground")} />
                </div>
              )}
              
              {/* Overlay for actions on grid */}
              {onDownload && (
                <div className="absolute inset-x-0 bottom-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-full group-hover:translate-y-0">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-6 w-full rounded-md shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(att);
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {onRemove && (
              <button 
                type="button"
                onClick={() => onRemove(att.id)}
                className={cn(
                  "absolute -top-1.5 -right-1.5 z-10 bg-background rounded-full shadow-lg border border-border transition-all",
                  !compact && "opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                )}
              >
                <X className={cn(compact ? "size-3.5" : "size-4", "text-destructive font-bold")} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
