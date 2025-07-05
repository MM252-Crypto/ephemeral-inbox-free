import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Timer, Mail, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  date: string;
  mailfrom: string;
  subject: string;
  data: string;
}

const Index = () => {
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();

  // Generate random email address
  const generateEmailAddress = useCallback(() => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const email = `${randomString}@maildrop.cc`;
    setEmailAddress(email);
    setMessages([]);
    setTimeLeft(600); // Reset timer
    setIsLoading(false);
    
    console.log('Generated email address:', email);
    
    toast({
      title: "Email Generated",
      description: `Your temporary email: ${email}`,
    });
  }, [toast]);

  // Fetch messages using GraphQL
  const fetchMessages = useCallback(async () => {
    if (!emailAddress) return;

    try {
      const mailbox = emailAddress.split('@')[0]; // Get username part
      
      const query = {
        query: `
          query GetInbox($mailbox: String!) {
            inbox(mailbox: $mailbox) {
              id
              date
              mailfrom
              subject
              data
            }
          }
        `,
        variables: { mailbox }
      };

      const response = await fetch('https://api.maildrop.cc/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.inbox) {
          setMessages(data.data.inbox);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [emailAddress]);

  // Fetch full message content
  const fetchMessageContent = useCallback(async (messageId: string) => {
    if (!emailAddress) return null;

    try {
      const mailbox = emailAddress.split('@')[0];
      
      const query = {
        query: `
          query GetMessage($mailbox: String!, $id: String!) {
            message(mailbox: $mailbox, id: $id) {
              id
              date
              mailfrom
              subject
              data
            }
          }
        `,
        variables: { mailbox, id: messageId }
      };

      const response = await fetch('https://api.maildrop.cc/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.message) {
          return data.data.message;
        }
      }
    } catch (error) {
      console.error('Error fetching message content:', error);
    }
    return null;
  }, [emailAddress]);

  // Copy email to clipboard
  const copyEmail = useCallback(() => {
    if (emailAddress) {
      navigator.clipboard.writeText(emailAddress);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard",
      });
    }
  }, [emailAddress, toast]);

  // Extend timer
  const extendTimer = useCallback(() => {
    setTimeLeft(600);
    toast({
      title: "Timer Extended",
      description: "Email valid for another 10 minutes",
    });
  }, [toast]);

  // Generate new email
  const generateNewEmail = useCallback(() => {
    generateEmailAddress();
  }, [generateEmailAddress]);

  // Parse email content to extract readable message
  const parseEmailContent = (rawContent: string) => {
    if (!rawContent) return 'No content available';
    
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
    
    // Extract URLs from href attributes before removing HTML tags
    const hrefMatches = content.match(/href=["']([^"']+)["']/g);
    const extractedUrls: string[] = [];
    if (hrefMatches) {
      hrefMatches.forEach(match => {
        const url = match.match(/href=["']([^"']+)["']/);
        if (url && url[1] && url[1].startsWith('http')) {
          extractedUrls.push(url[1]);
        }
      });
    }
    
    // Also look for plain URLs in the text
    const plainUrls = content.match(/https?:\/\/[^\s<>"']+/g) || [];
    extractedUrls.push(...plainUrls);
    
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
    
    // Add extracted URLs at the end if any were found
    if (extractedUrls.length > 0) {
      const uniqueUrls = [...new Set(extractedUrls)]; // Remove duplicates
      content += '\n\n🔗 Links:\n' + uniqueUrls.join('\n');
    }
    
    return content || 'No readable message content found';
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    generateEmailAddress();
  }, [generateEmailAddress]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (emailAddress) {
      toast({
        title: "Email Expired",
        description: "Generating new temporary email...",
      });
      generateEmailAddress();
    }
  }, [timeLeft, emailAddress, generateEmailAddress, toast]);

  // Poll for messages
  useEffect(() => {
    if (emailAddress) {
      const interval = setInterval(fetchMessages, 5000);
      fetchMessages(); // Initial fetch
      return () => clearInterval(interval);
    }
  }, [emailAddress, fetchMessages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Generating your temporary email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Banner Ad */}
        <div className="mb-6 text-center">
          <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
            <p className="text-muted-foreground">Google AdSense Banner Ad (728x90)</p>
            <p className="text-xs text-muted-foreground mt-1">Replace with actual AdSense code</p>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Temporary Email</h1>
          <p className="text-muted-foreground">Free anonymous email for 10 minutes</p>
        </div>

        {/* Email Display */}
        {emailAddress && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <span className="text-4xl font-bold break-all">{emailAddress}</span>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-lg">
                    <Timer className="h-5 w-5" />
                    <span className="font-mono">{formatTime(timeLeft)}</span>
                  </div>
                  
                  <Button onClick={copyEmail} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Email
                  </Button>
                  
                  <Button onClick={extendTimer} variant="outline" size="sm">
                    <Timer className="h-4 w-4 mr-2" />
                    Extend
                  </Button>
                  
                  <Button onClick={generateNewEmail} variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    New Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Square Ad Between Email and Inbox */}
        <div className="mb-6 text-center">
          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/20">
            <p className="text-muted-foreground">Google AdSense Square Ad (300x250)</p>
            <p className="text-xs text-muted-foreground mt-1">Replace with actual AdSense code</p>
          </div>
        </div>

        {/* Inbox */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Inbox ({messages.length})</h2>
            
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Your inbox updates automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={async () => {
                      const fullMessage = await fetchMessageContent(message.id);
                      if (fullMessage) {
                        setSelectedMessage(fullMessage);
                      } else {
                        setSelectedMessage(message); // Fallback to original message
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{message.mailfrom}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(message.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-semibold mb-1">{message.subject}</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                      {message.data || 'Click to view full email content...'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Placeholder */}
        <div className="mt-8 text-center">
          <div className="border-2 border-dashed border-border rounded-lg p-8 bg-muted/20">
            <p className="text-muted-foreground">Google AdSense Leaderboard Ad (728x90)</p>
            <p className="text-sm text-muted-foreground mt-1">Replace with actual AdSense code</p>
          </div>
        </div>

        {/* Footer Ad */}
        <div className="mt-8 mb-6 text-center">
          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-muted/20">
            <p className="text-muted-foreground">Google AdSense Footer Ad (320x100)</p>
            <p className="text-xs text-muted-foreground mt-1">Replace with actual AdSense code</p>
          </div>
        </div>

        {/* Email Details Dialog */}
        <Dialog open={selectedMessage !== null} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Details
              </DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">From</label>
                    <p className="font-medium">{selectedMessage.mailfrom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm">{new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                    <p className="font-semibold">{selectedMessage.subject}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message</label>
                  <div className="mt-2 p-4 bg-muted/20 rounded-lg min-h-[200px]">
                    <div className="whitespace-pre-wrap text-sm">
                      {parseEmailContent(selectedMessage.data || '')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;