import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Mail } from 'lucide-react';
import { Message } from '@/types/email';
import { parseEmailContent } from '@/utils/emailParser';

interface EmailDialogProps {
  selectedMessage: Message | null;
  onClose: () => void;
}

export const EmailDialog = ({ selectedMessage, onClose }: EmailDialogProps) => {
  return (
    <Dialog open={selectedMessage !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Details
          </DialogTitle>
          <DialogDescription>
            View the full content and links from this email message
          </DialogDescription>
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
                {(() => {
                  const parsed = parseEmailContent(selectedMessage.data || '');
                  return (
                    <div className="space-y-4">
                      <div className="whitespace-pre-wrap text-sm">
                        {parsed.text}
                      </div>
                      {parsed.links.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium mb-2">🔗 Links:</h4>
                          <div className="space-y-2">
                            {parsed.links.map((link, index) => (
                              <div key={index}>
                                <a 
                                  href={link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline break-all text-sm"
                                >
                                  {link}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};