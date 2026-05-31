import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getOrCreateRoom, getMyChatRooms, getChatMessages } from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { toast } from 'sonner';
import type { ChatRoom, ChatMessage } from '@/types/chat';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function Chat() {
  const { t } = useI18n();
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [pastRooms, setPastRooms] = useState<ChatRoom[]>([]);
  const [selectedPastRoomId, setSelectedPastRoomId] = useState<string | null>(null);
  const [pastMessages, setPastMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const pastScrollRef = useRef<HTMLDivElement>(null);

  const { messages, connected, uploading, sendMessage, uploadAttachment } = useChat(currentRoom?.id ?? null);

  const loadPastRooms = useCallback(async () => {
    const res = await getMyChatRooms();
    if (res.code === 200 && res.data) {
      setPastRooms(res.data.filter((r) => r.status === 'CLOSED'));
    }
  }, []);

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
    if (!text || !connected) return;
    sendMessage(text);
    setInput('');
  };

  const handleUpload = async (file: File) => {
    if (!connected) return;
    try {
      await uploadAttachment(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('chat.upload.error');
      toast.error(message);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[calc(100dvh-12rem)] min-h-[400px]">
      <Tabs
        defaultValue="current"
        className="flex flex-col flex-1 min-h-0"
        onValueChange={(v) => {
          if (v === 'history') {
            loadPastRooms();
            setSelectedPastRoomId(null);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h1 className="text-lg sm:text-xl font-semibold truncate">
            {t('chat.title')}
          </h1>
          <TabsList>
            <TabsTrigger value="current">{t('chat.tab.current')}</TabsTrigger>
            <TabsTrigger value="history">{t('chat.tab.history')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="current"
          className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden"
        >
          <div className="flex justify-end mb-2">
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? t('chat.connected') : t('chat.connecting')}
            </Badge>
          </div>

          <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-muted/30">
            <div className="p-3 sm:p-4">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {t('chat.empty')}
                </p>
              )}
              {messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  msg={msg}
                  mineType="USER"
                  otherLabel={t('chat.admin')}
                  fileLabel={t('chat.fileUnavailable')}
                />
              ))}
            </div>
          </div>

          <div className="mt-3">
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
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden"
        >
          {selectedPastRoomId === null ? (
            <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg">
              {pastRooms.length === 0 && (
                <p className="text-center text-muted-foreground text-sm p-6">
                  {t('chat.history.empty')}
                </p>
              )}
              {pastRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedPastRoomId(room.id)}
                  className="w-full text-left p-3 border-b last:border-b-0 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">
                      {t('chat.history.room')} #{room.id}
                    </span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {t('chat.status.closed')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(room.updatedAt)}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPastRoomId(null)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {t('chat.history.back')}
                </Button>
                <Badge variant="secondary" className="text-xs">
                  {t('chat.history.readonly')}
                </Badge>
              </div>
              <div ref={pastScrollRef} className="flex-1 min-h-0 overflow-y-auto border rounded-lg bg-muted/30">
                <div className="p-3 sm:p-4">
                  {pastMessages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      {t('chat.history.noMessages')}
                    </p>
                  )}
                  {pastMessages.map((msg) => (
                    <ChatMessageBubble
                      key={msg.id}
                      msg={msg}
                      mineType="USER"
                      otherLabel={t('chat.admin')}
                      fileLabel={t('chat.fileUnavailable')}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
