import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Message } from '@/types/email';

interface MessageListProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
}

export const MessageList = ({ messages, onMessageClick }: MessageListProps) => {
  return (
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
                onClick={() => onMessageClick(message)}
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
  );
};