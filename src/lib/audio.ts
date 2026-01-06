/**
 * Audio file utilities - simplified version
 * Only handles file extension extraction, no complex MimeType logic needed
 */

// Supported audio extensions
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'webm', 'flac'];

/**
 * Extract file extension from URL or filename
 * Handles query parameters and fragments
 */
export function getFileExtension(urlOrPath: string): string {
  let pathname = urlOrPath;

  try {
    // Try to parse as URL first
    const url = new URL(urlOrPath);
    pathname = url.pathname;
  } catch {
    // Not a valid URL, treat as file path
    // Remove query params and fragments manually for non-URL paths
    pathname = urlOrPath.split('?')[0].split('#')[0];
  }

  // Extract extension from pathname
  const ext = pathname.split('.').pop()?.toLowerCase();
  if (ext && SUPPORTED_EXTENSIONS.includes(ext)) {
    return ext;
  }

  return 'mp3'; // Default fallback
}

/**
 * Check if extension is supported
 */
export function isSupportedExtension(ext: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(ext.toLowerCase());
}

/**
 * Get supported extensions list
 */
export function getSupportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS];
}
