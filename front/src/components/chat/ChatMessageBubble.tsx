import type { ReactNode } from 'react';
import { Paperclip } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import type { ChatMessage, SenderType } from '@/types/chat';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function attachmentUrl(att: NonNullable<ChatMessage['attachment']>): string {
  return att.viewUrl ?? att.thumbnailUrl ?? att.storedUrl;
}

/** True when `msg` falls on a different calendar day than `prev` (or there is no `prev`). */
export function startsNewDay(prev: ChatMessage | undefined, msg: ChatMessage): boolean {
  if (!prev) return true;
  return new Date(prev.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
}

/** Centred day label between messages from different days. */
export function ChatDaySeparator({ label }: { label: ReactNode }) {
  return (
    <p className="py-1 text-center text-[11px] uppercase tracking-[0.14em] text-muted-foreground figure">
      {label}
    </p>
  );
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
    <div className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}>
      {!isMine && <p className="mb-1 text-[11px] text-muted-foreground">{otherLabel}</p>}

      <div
        className={cn(
          'max-w-[78%] space-y-1.5 px-3.5 py-2.5 text-sm leading-relaxed break-words',
          isMine ? 'bg-foreground text-background' : 'bg-muted text-foreground',
        )}
      >
        {messageType === 'IMAGE' && att && (
          <a
            href={attachmentUrl(att)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('block w-fit max-w-full border', isMine ? 'border-background/20' : 'border-border')}
          >
            <img
              src={attachmentUrl(att)}
              alt={att.originalFilename}
              className="block max-h-48 max-w-full object-contain"
            />
          </a>
        )}

        {messageType === 'FILE' && att && (
          <a
            href={attachmentUrl(att)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 underline underline-offset-4',
              isMine
                ? 'text-background decoration-background/40 hover:decoration-background'
                : 'text-foreground decoration-foreground/30 hover:decoration-foreground',
            )}
          >
            <Paperclip className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="truncate">{att.originalFilename}</span>
          </a>
        )}

        {msg.content && (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}

        {messageType === 'FILE' && !att && (
          <p className={isMine ? 'text-background/70' : 'text-muted-foreground'}>{fileLabel}</p>
        )}
      </div>

      <time dateTime={msg.createdAt} className="mt-1 text-[11px] text-muted-foreground figure">
        {formatTime(msg.createdAt)}
      </time>
    </div>
  );
}
