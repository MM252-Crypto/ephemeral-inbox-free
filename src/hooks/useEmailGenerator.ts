import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useEmailGenerator = () => {
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Generate random email address
  const generateEmailAddress = useCallback(() => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const email = `${randomString}@maildrop.cc`;
    setEmailAddress(email);
    setTimeLeft(600); // Reset timer
    setIsLoading(false);
    
    console.log('Generated email address:', email);
    
    toast({
      title: "Email Generated",
      description: `Your temporary email: ${email}`,
    });
  }, [toast]);

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

  return {
    emailAddress,
    timeLeft,
    isLoading,
    formatTime,
    copyEmail,
    extendTimer,
    generateNewEmail
  };
};