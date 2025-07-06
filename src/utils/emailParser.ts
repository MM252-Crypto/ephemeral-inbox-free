import { ParsedEmailContent } from '@/types/email';

export const parseEmailContent = (rawContent: string): ParsedEmailContent => {
  if (!rawContent) return { text: 'No content available', links: [] };
  
  let content = rawContent;
  
  // First, try to find HTML content between body tags or after headers
  const htmlBodyMatch = content.match(/<body[^>]*>(.*?)<\/body>/is);
  if (htmlBodyMatch) {
    content = htmlBodyMatch[1];
  }
  
  // Look for content after headers (find double newline that indicates end of headers)
  const headerEndIndex = content.indexOf('\n\n');
  if (headerEndIndex !== -1) {
    content = content.substring(headerEndIndex + 2);
  }
  
  // Remove DKIM signatures and technical headers first
  content = content
    .replace(/^DKIM-Signature:.*$/gm, '')
    .replace(/^Received:.*$/gm, '')
    .replace(/^Message-ID:.*$/gm, '')
    .replace(/^Content-.*$/gm, '')
    .replace(/^by maildrop.*$/gm, '')
    .replace(/^with SMTP.*$/gm, '')
    .replace(/^for .*@maildrop\.cc.*$/gm, '');
  
  // Decode quoted-printable encoding (=20 = space, =3D = =, etc.)
  content = content
    .replace(/=\r?\n/g, '') // Remove soft line breaks first
    .replace(/=20/g, ' ')
    .replace(/=3D/g, '=')
    .replace(/=2E/g, '.')
    .replace(/=2F/g, '/')
    .replace(/=3A/g, ':')
    .replace(/=3F/g, '?')
    .replace(/=26/g, '&')
    .replace(/=([0-9A-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

  // Fix common character encoding issues
  content = content
    .replace(/â/g, "'") // Fix apostrophe encoding
    .replace(/â€™/g, "'") // Another apostrophe variant
    .replace(/â€œ/g, '"') // Fix left double quote
    .replace(/â€/g, '"') // Fix right double quote
    .replace(/â€"/g, '–') // Fix en dash
    .replace(/â€"/g, '—') // Fix em dash
    .replace(/Ã¡/g, 'á') // Fix accented a
    .replace(/Ã©/g, 'é') // Fix accented e
    .replace(/Ã­/g, 'í') // Fix accented i
    .replace(/Ã³/g, 'ó') // Fix accented o
    .replace(/Ãº/g, 'ú'); // Fix accented u
  
  // Extract URLs more comprehensively
  const extractedUrls: string[] = [];
  
  // Extract URLs from href attributes (with better regex)
  const hrefMatches = content.match(/href\s*=\s*["']([^"']*https?:\/\/[^"']+)["']/gi) || [];
  hrefMatches.forEach(match => {
    const url = match.match(/href\s*=\s*["']([^"']+)["']/i);
    if (url && url[1]) {
      extractedUrls.push(url[1].trim());
    }
  });
  
  // Extract plain URLs with more comprehensive regex
  const urlRegex = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?/gi;
  const plainUrls = content.match(urlRegex) || [];
  extractedUrls.push(...plainUrls);
  
  // Extract URLs that might be broken across lines or have spaces
  const brokenUrlRegex = /https?:\/\/[^\s<>"'\n]+(?:\s*\n\s*[^\s<>"'\n]+)*/gi;
  const brokenUrls = content.match(brokenUrlRegex) || [];
  brokenUrls.forEach(url => {
    const cleanedUrl = url.replace(/\s+/g, '').replace(/\n/g, '');
    if (cleanedUrl.match(/^https?:\/\/.+/)) {
      extractedUrls.push(cleanedUrl);
    }
  });
  
  // Remove HTML tags but preserve text content
  content = content
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style blocks
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script blocks
    .replace(/<[^>]*>/g, ' ') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
    .trim();
  
  // Clean up any remaining CSS-like content but preserve meaningful text
  if (content.includes('padding:') || content.includes('margin:') || content.includes('font-family:')) {
    // Extract readable sentences and URLs
    const sentences = content.match(/[A-Z][^.!?]*[.!?]/g) || [];
    const emailAddresses = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    
    const meaningfulContent = [...sentences, ...emailAddresses].join('\n\n');
    if (meaningfulContent.trim()) {
      content = meaningfulContent;
    }
  }
  
  // Return both text and links separately
  const uniqueUrls = [...new Set(extractedUrls)]; // Remove duplicates
  return {
    text: content || 'No readable message content found',
    links: uniqueUrls
  };
};