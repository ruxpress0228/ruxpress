import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getOrCreateRoom, getMyChatRooms, getChatMessages } from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useI18n } from '@/i18n/I18nProvider';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/components/ui/utils';
import { PageHeader } from '@/components/page';
import { ChatDaySeparator, ChatMessageBubble, startsNewDay } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { toast } from 'sonner';
import type { ChatRoom, ChatMessage } from '@/types/chat';

const DAY_LABEL: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function Chat() {
  const { t, locale } = useI18n();
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [pastRooms, setPastRooms] = useState<ChatRoom[]>([]);
  const [selectedPastRoomId, setSelectedPastRoomId] = useState<string | null>(null);
  const [pastMessages, setPastMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pastScrollRef = useRef<HTMLDivElement>(null);

  const loadPastRooms = useCallback(async () => {
    const res = await getMyChatRooms();
    if (res.code === 200 && res.data) {
      setPastRooms(res.data.filter((r) => r.status === 'CLOSED'));
    }
  }, []);

  const isLive = currentRoom?.status === 'OPEN';

  const handleRoomClosed = useCallback(() => {
    toast.info(t('chat.closedByAdmin'));
    setCurrentRoom((prev) => (prev ? { ...prev, status: 'CLOSED' } : prev));
    void loadPastRooms();
  }, [t, loadPastRooms]);

  const {
    messages,
    connected,
    uploading,
    roomClosed,
    sendMessage,
    uploadAttachment,
    resetRoomClosed,
  } = useChat(currentRoom?.id ?? null, {
    connectLive: isLive,
    onRoomClosed: handleRoomClosed,
  });

  const chatEnded = roomClosed || currentRoom?.status === 'CLOSED';

  const handleStartNewChat = async () => {
    try {
      const res = await getOrCreateRoom();
      if (res.code === 200 && res.data) {
        setCurrentRoom(res.data);
        resetRoomClosed();
        void loadPastRooms();
      }
    } catch {
      toast.error(t('chat.newChatError'));
    }
  };

  useEffect(() => {
    getOrCreateRoom().then((res) => {
      if (res.code === 200 && res.data) setCurrentRoom(res.data);
    });
    loadPastRooms();
  }, [loadPastRooms]);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!selectedPastRoomId) {
      setPastMessages([]);
      return;
    }
    getChatMessages(selectedPastRoomId).then((res) => {
      if (res.code === 200 && res.data) {
        setPastMessages(res.data);
        setTimeout(() => {
          const el = pastScrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        }, 0);
      }
    });
  }, [selectedPastRoomId]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected || chatEnded) return;
    sendMessage(text);
    setInput('');
  };

  const handleUpload = async (file: File) => {
    if (!connected || chatEnded) return;
    try {
      await uploadAttachment(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('chat.upload.error');
      toast.error(message);
    }
  };

  const dayLabel = (iso: string) => formatDate(iso, locale, DAY_LABEL);

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] min-h-[25rem] w-full max-w-3xl flex-col lg:h-[calc(100dvh-9rem)]">
      <Tabs
        defaultValue="current"
        className="flex min-h-0 flex-1 flex-col gap-0"
        onValueChange={(v) => {
          if (v === 'history') {
            loadPastRooms();
            setSelectedPastRoomId(null);
          }
        }}
      >
        <PageHeader
          title={t('chat.title')}
          className="mb-5 md:mb-6"
          actions={
            <TabsList>
              <TabsTrigger value="current">{t('chat.tab.current')}</TabsTrigger>
              <TabsTrigger value="history">{t('chat.tab.history')}</TabsTrigger>
            </TabsList>
          }
        />

        <TabsContent
          value="current"
          className="flex min-h-0 flex-1 flex-col border border-border data-[state=inactive]:hidden"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <p className="min-w-0 truncate text-sm font-medium">{t('chat.admin')}</p>
            <p className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  connected && !chatEnded ? 'bg-foreground' : 'bg-muted-foreground/40',
                )}
                aria-hidden
              />
              {chatEnded
                ? t('chat.status.closed')
                : connected
                  ? t('chat.connected')
                  : t('chat.connecting')}
            </p>
          </div>

          {chatEnded && (
            <div className="flex flex-col items-start gap-3 border-b border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p>{t('chat.closedByAdmin')}</p>
              <Button variant="outline" size="sm" onClick={() => void handleStartNewChat()}>
                {t('chat.startNew')}
              </Button>
            </div>
          )}

          <div ref={chatScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">{t('chat.empty')}</p>
            )}
            {messages.map((msg, i) => (
              <Fragment key={msg.id}>
                {startsNewDay(messages[i - 1], msg) && <ChatDaySeparator label={dayLabel(msg.createdAt)} />}
                <ChatMessageBubble
                  msg={msg}
                  mineType="USER"
                  otherLabel={t('chat.admin')}
                  fileLabel={t('chat.fileUnavailable')}
                />
              </Fragment>
            ))}
          </div>

          {chatEnded ? (
            <p className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
              {t('chat.closedHint')}
            </p>
          ) : (
            <ChatInputBar
              input={input}
              onInputChange={setInput}
              onSend={handleSend}
              onUpload={handleUpload}
              disabled={!connected}
              uploading={uploading}
              placeholder={t('chat.inputPlaceholder')}
              sendLabel={t('chat.send')}
              attachLabel={t('chat.attach')}
              fileTooLargeLabel={t('chat.upload.fileTooLarge')}
            />
          )}
        </TabsContent>

        <TabsContent
          value="history"
          className="flex min-h-0 flex-1 flex-col border border-border data-[state=inactive]:hidden"
        >
          {selectedPastRoomId === null ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {pastRooms.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {t('chat.history.empty')}
                </p>
              )}
              <ul>
                {pastRooms.map((room) => (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPastRoomId(room.id)}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {t('chat.history.room')} <span className="figure">#{room.id}</span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground figure">
                          {formatDateTime(room.updatedAt)}
                        </span>
                      </span>
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {t('chat.status.closed')}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-2 py-2 md:px-3">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPastRoomId(null)}>
                  <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
                  {t('chat.history.back')}
                </Button>
                <Badge variant="secondary" className="mr-1 px-1.5 py-0 text-[10px]">
                  {t('chat.history.readonly')}
                </Badge>
              </div>
              <div ref={pastScrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {pastMessages.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {t('chat.history.noMessages')}
                  </p>
                )}
                {pastMessages.map((msg, i) => (
                  <Fragment key={msg.id}>
                    {startsNewDay(pastMessages[i - 1], msg) && (
                      <ChatDaySeparator label={dayLabel(msg.createdAt)} />
                    )}
                    <ChatMessageBubble
                      msg={msg}
                      mineType="USER"
                      otherLabel={t('chat.admin')}
                      fileLabel={t('chat.fileUnavailable')}
                    />
                  </Fragment>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
