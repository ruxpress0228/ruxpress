import { useRef } from 'react';
import { ArrowUp, Ellipsis, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ChatInputBarProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onUpload: (file: File) => void;
  disabled?: boolean;
  uploading?: boolean;
  placeholder: string;
  sendLabel: string;
  attachLabel: string;
  fileTooLargeLabel: string;
}

export function ChatInputBar({
  input,
  onInputChange,
  onSend,
  onUpload,
  disabled = false,
  uploading = false,
  placeholder,
  sendLabel,
  attachLabel,
  fileTooLargeLabel,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      window.alert(fileTooLargeLabel);
      return;
    }
    onUpload(file);
  };

  return (
    <div className="flex items-center gap-1 border-t border-border p-3 transition-colors focus-within:border-foreground">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        title={attachLabel}
        aria-label={attachLabel}
      >
        <Paperclip className="size-4" strokeWidth={1.5} aria-hidden />
      </Button>
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled || uploading}
        maxLength={2000}
        className="h-9 min-w-0 flex-1 border-0 bg-transparent px-2 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
      />
      <Button
        type="button"
        size="icon"
        onClick={onSend}
        disabled={disabled || uploading || !input.trim()}
        title={sendLabel}
        aria-label={sendLabel}
      >
        {uploading ? (
          <Ellipsis className="size-4" strokeWidth={1.5} aria-hidden />
        ) : (
          <ArrowUp className="size-4" strokeWidth={1.5} aria-hidden />
        )}
      </Button>
    </div>
  );
}
