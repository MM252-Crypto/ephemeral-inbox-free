import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Timer, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  createdAt: string;
}

interface EmailAccount {
  id: string;
  address: string;
  password: string;
}

const Index = () => {
  const [emailAccount, setEmailAccount] = useState<EmailAccount | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Create email account
  const createEmailAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First get available domains
      const domainsResponse = await fetch('https://api.mail.tm/domains');
      const domains = await domainsResponse.json();
      
      if (!domains || domains.length === 0) {
        throw new Error('No domains available');
      }

      // Create random email address
      const randomString = Math.random().toString(36).substring(2, 15);
      const email = `${randomString}@${domains[0].domain}`;
      const password = Math.random().toString(36).substring(2, 15);

      // Create account
      const accountResponse = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: email,
          password: password,
        }),
      });

      if (!accountResponse.ok) {
        throw new Error('Failed to create account');
      }

      const account = await accountResponse.json();
      const newAccount = { ...account, password };
      
      setEmailAccount(newAccount);
      setTimeLeft(600); // Reset timer
      
      console.log('Email account created:', newAccount);
    } catch (error) {
      console.error('Error creating email account:', error);
      toast({
        title: "Error",
        description: "Failed to create temporary email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!emailAccount) return;

    try {
      const response = await fetch(`https://api.mail.tm/messages`, {
        headers: {
          'Authorization': `Bearer ${emailAccount.id}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [emailAccount]);

  // Copy email to clipboard
  const copyEmail = useCallback(() => {
    if (emailAccount) {
      navigator.clipboard.writeText(emailAccount.address);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard",
      });
    }
  }, [emailAccount, toast]);

  // Extend timer
  const extendTimer = useCallback(() => {
    setTimeLeft(600);
    toast({
      title: "Timer Extended",
      description: "Email valid for another 10 minutes",
    });
  }, [toast]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize on mount
  useEffect(() => {
    createEmailAccount();
  }, [createEmailAccount]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (emailAccount) {
      toast({
        title: "Email Expired",
        description: "Generating new temporary email...",
      });
      createEmailAccount();
    }
  }, [timeLeft, emailAccount, createEmailAccount, toast]);

  // Poll for messages
  useEffect(() => {
    if (emailAccount) {
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [emailAccount, fetchMessages]);

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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Temporary Email</h1>
          <p className="text-muted-foreground">Free anonymous email for 10 minutes</p>
        </div>

        {/* Email Display */}
        {emailAccount && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <span className="text-4xl font-bold break-all">{emailAccount.address}</span>
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
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <div key={message.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{message.from.name || message.from.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="font-semibold mb-1">{message.subject}</div>
                    <div className="text-sm text-muted-foreground">{message.intro}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Placeholder */}
        <div className="mt-8 text-center">
          <div className="border-2 border-dashed border-border rounded-lg p-8 bg-muted/20">
            <p className="text-muted-foreground">Google AdSense Ad Placement</p>
            <p className="text-sm text-muted-foreground mt-1">Replace with actual AdSense code</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
