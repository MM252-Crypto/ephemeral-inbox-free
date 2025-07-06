interface AdPlaceholderProps {
  size: string;
  description: string;
  className?: string;
}

export const AdPlaceholder = ({ size, description, className = "" }: AdPlaceholderProps) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="border-2 border-dashed border-border rounded-lg p-4 bg-muted/20">
        <p className="text-muted-foreground">Google AdSense {description} ({size})</p>
        <p className="text-xs text-muted-foreground mt-1">Replace with actual AdSense code</p>
      </div>
    </div>
  );
};