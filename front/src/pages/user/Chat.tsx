import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getOrCreateRoom, getMyChatRooms, getChatMessages } from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useI18n } from '@/i18n/I18nProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ChatRoom, ChatMessage, SenderType } from '@/types/chat';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function MessageBubble({
  msg,
  mineType,
}: {
  msg: ChatMessage;
  mineType: SenderType;
}) {
  const { t } = useI18n();
  const isMine = msg.senderType === mineType;
  const otherLabelKey = msg.senderType === 'USER' ? 'chat.user' : 'chat.admin';
  return (
    <div className={`flex mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm break-words ${
          isMine
            ? 'bg-primary text-primary-foreground'
            : 'bg-background border'
        }`}
      >
        {!isMine && (
          <p className="text-xs font-medium mb-1 opacity-60">
            {t(otherLabelKey)}
          </p>
        )}
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className="text-[10px] opacity-50 mt-1 text-right">
          {formatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function Chat() {
  const { t } = useI18n();
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [pastRooms, setPastRooms] = useState<ChatRoom[]>([]);
  const [selectedPastRoomId, setSelectedPastRoomId] = useState<string | null>(null);
  const [pastMessages, setPastMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pastBottomRef = useRef<HTMLDivElement>(null);

  const { messages, connected, sendMessage } = useChat(currentRoom?.id ?? null);

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedPastRoomId) {
      setPastMessages([]);
      return;
    }
    getChatMessages(selectedPastRoomId).then((res) => {
      if (res.code === 200 && res.data) {
        setPastMessages(res.data);
        setTimeout(
          () => pastBottomRef.current?.scrollIntoView({ behavior: 'auto' }),
          0,
        );
      }
    });
  }, [selectedPastRoomId]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
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

          <ScrollArea className="flex-1 min-h-0 border rounded-lg bg-muted/30">
            <div className="p-3 sm:p-4">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  {t('chat.empty')}
                </p>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} mineType="USER" />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2 mt-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.inputPlaceholder')}
              disabled={!connected}
              maxLength={2000}
            />
            <Button
              onClick={handleSend}
              disabled={!connected || !input.trim()}
            >
              {t('chat.send')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="flex-1 min-h-0 flex flex-col mt-0 data-[state=inactive]:hidden"
        >
          {selectedPastRoomId === null ? (
            <ScrollArea className="flex-1 min-h-0 border rounded-lg">
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
            </ScrollArea>
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
              <ScrollArea className="flex-1 min-h-0 border rounded-lg bg-muted/30">
                <div className="p-3 sm:p-4">
                  {pastMessages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      {t('chat.history.noMessages')}
                    </p>
                  )}
                  {pastMessages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} mineType="USER" />
                  ))}
                  <div ref={pastBottomRef} />
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
