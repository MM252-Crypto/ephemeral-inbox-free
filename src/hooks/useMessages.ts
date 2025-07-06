import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/types/email';

export const useMessages = (emailAddress: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

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
  const fetchMessageContent = useCallback(async (messageId: string): Promise<Message | null> => {
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

  // Poll for messages
  useEffect(() => {
    if (emailAddress) {
      const interval = setInterval(fetchMessages, 5000);
      fetchMessages(); // Initial fetch
      return () => clearInterval(interval);
    }
  }, [emailAddress, fetchMessages]);

  // Reset messages when email changes
  useEffect(() => {
    if (!emailAddress) {
      setMessages([]);
    }
  }, [emailAddress]);

  return {
    messages,
    fetchMessages,
    fetchMessageContent
  };
};