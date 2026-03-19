/**
 * Attachment types shared across various communication modules (Chat, Email, etc.)
 */

export type AttachmentType = 'image' | 'voice' | 'file' | 'video' | 'audio';

export interface Attachment {
  id: string;
  type: AttachmentType | string; // Allow string for specific mime types
  url?: string;
  name?: string;
  size?: number; // Size in bytes
  preview?: string; // Optional preview URL
  thumbnail?: string; // Optional thumbnail URL (common in chat)
}
