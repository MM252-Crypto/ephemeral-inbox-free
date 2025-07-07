import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Timer, Mail } from 'lucide-react';

interface EmailDisplayProps {
  emailAddress: string;
  timeLeft: number;
  formatTime: (seconds: number) => string;
  copyEmail: () => void;
  extendTimer: () => void;
  generateNewEmail: () => void;
}

export const EmailDisplay = ({ 
  emailAddress, 
  timeLeft, 
  formatTime, 
  copyEmail, 
  extendTimer, 
  generateNewEmail 
}: EmailDisplayProps) => {
  if (!emailAddress) return null;

  return (
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
            
            <Button onClick={copyEmail} variant="outline" size="sm" className="tg-button">
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
  );
};