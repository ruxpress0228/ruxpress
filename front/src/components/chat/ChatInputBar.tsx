import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
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
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled || uploading}
        onClick={() => fileInputRef.current?.click()}
        title={attachLabel}
        aria-label={attachLabel}
      >
        <Paperclip className="w-4 h-4" />
      </Button>
      <Input
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || uploading}
        maxLength={2000}
        className="flex-1"
      />
      <Button onClick={onSend} disabled={disabled || uploading || !input.trim()}>
        {uploading ? '...' : sendLabel}
      </Button>
    </div>
  );
}
