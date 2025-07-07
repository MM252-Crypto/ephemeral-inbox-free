import { useState, useEffect } from 'react';
import { Message } from '@/types/email';
import { useEmailGenerator } from '@/hooks/useEmailGenerator';
import { useMessages } from '@/hooks/useMessages';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { EmailDisplay } from '@/components/EmailDisplay';
import { MessageList } from '@/components/MessageList';
import { EmailDialog } from '@/components/EmailDialog';
import { AdPlaceholder } from '@/components/AdPlaceholder';

const Index = () => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  // Telegram WebApp integration
  const { webApp, isLoading: isTelegramLoading, isTelegramEnvironment, user } = useTelegramWebApp();
  
  const {
    emailAddress,
    timeLeft,
    isLoading,
    formatTime,
    copyEmail,
    extendTimer,
    generateNewEmail
  } = useEmailGenerator();

  const { messages, fetchMessageContent } = useMessages(emailAddress);

  // Show main button in Telegram when email is ready
  useEffect(() => {
    if (webApp && emailAddress && !isLoading) {
      webApp.MainButton.setText('Copy Email Address');
      webApp.MainButton.show();
      webApp.MainButton.onClick(copyEmail);
      
      return () => {
        webApp.MainButton.offClick(copyEmail);
        webApp.MainButton.hide();
      };
    }
  }, [webApp, emailAddress, isLoading, copyEmail]);

  const handleMessageClick = async (message: Message) => {
    const fullMessage = await fetchMessageContent(message.id);
    if (fullMessage) {
      setSelectedMessage(fullMessage);
    } else {
      setSelectedMessage(message); // Fallback to original message
    }
  };

  if (isLoading || isTelegramLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background tg-webapp">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">
            {isTelegramLoading ? 'Loading Telegram Mini App...' : 'Generating your temporary email...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 tg-webapp">
      <div className="max-w-4xl mx-auto">
        {/* Only show ads if not in Telegram environment */}
        {!isTelegramEnvironment && (
          <AdPlaceholder size="728x90" description="Banner Ad" className="mb-6" />
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {isTelegramEnvironment && user ? `Hello ${user.first_name}!` : 'Temporary Email'}
          </h1>
          <p className="text-muted-foreground">
            {isTelegramEnvironment ? 'Your temporary email in Telegram' : 'Free anonymous email for 10 minutes'}
          </p>
        </div>

        {/* Email Display */}
        <EmailDisplay
          emailAddress={emailAddress}
          timeLeft={timeLeft}
          formatTime={formatTime}
          copyEmail={copyEmail}
          extendTimer={extendTimer}
          generateNewEmail={generateNewEmail}
        />

        {/* Only show ads if not in Telegram environment */}
        {!isTelegramEnvironment && (
          <AdPlaceholder size="300x250" description="Square Ad" className="mb-6" />
        )}

        {/* Inbox */}
        <MessageList messages={messages} onMessageClick={handleMessageClick} />

        {/* Only show ads if not in Telegram environment */}
        {!isTelegramEnvironment && (
          <>
            <AdPlaceholder size="728x90" description="Leaderboard Ad" className="mt-8" />
            <AdPlaceholder size="320x100" description="Footer Ad" className="mt-8 mb-6" />
          </>
        )}

        {/* Email Details Dialog */}
        <EmailDialog
          selectedMessage={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      </div>
    </div>
  );
};

export default Index;