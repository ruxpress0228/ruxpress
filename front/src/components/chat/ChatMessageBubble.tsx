import { Paperclip } from 'lucide-react';
import type { ChatMessage, SenderType } from '@/types/chat';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function attachmentUrl(att: NonNullable<ChatMessage['attachment']>): string {
  return att.viewUrl ?? att.thumbnailUrl ?? att.storedUrl;
}

export interface ChatMessageBubbleProps {
  msg: ChatMessage;
  mineType: SenderType;
  otherLabel: string;
  fileLabel: string;
}

export function ChatMessageBubble({ msg, mineType, otherLabel, fileLabel }: ChatMessageBubbleProps) {
  const isMine = msg.senderType === mineType;
  const messageType = msg.messageType ?? 'TEXT';
  const att = msg.attachment;

  return (
    <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm break-words ${
          isMine ? 'bg-primary text-primary-foreground' : 'bg-background border'
        }`}
      >
        {!isMine && (
          <p className="text-xs font-medium mb-1 opacity-60">{otherLabel}</p>
        )}

        {messageType === 'IMAGE' && att && (
          <a href={attachmentUrl(att)} target="_blank" rel="noopener noreferrer" className="block mb-1">
            <img
              src={attachmentUrl(att)}
              alt={att.originalFilename}
              className="max-w-full max-h-48 rounded object-contain"
            />
          </a>
        )}

        {messageType === 'FILE' && att && (
          <a
            href={attachmentUrl(att)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 underline mb-1 ${isMine ? 'text-primary-foreground' : 'text-blue-600'}`}
          >
            <Paperclip className="w-3 h-3 shrink-0" />
            {att.originalFilename}
          </a>
        )}

        {msg.content && (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}

        {messageType === 'FILE' && !att && (
          <p className="opacity-70">{fileLabel}</p>
        )}

        <p className="text-[10px] opacity-50 mt-1 text-right">{formatTime(msg.createdAt)}</p>
      </div>
    </div>
  );
}
