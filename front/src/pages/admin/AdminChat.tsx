import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  getAdminChatRooms,
  adminJoinRoom,
  adminCloseRoom,
} from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { toast } from 'sonner';
import type { ChatRoom, ChatRoomStatus } from '@/types/chat';

const PAGE_SIZE_OPTIONS = [20, 30, 50, 100] as const;

export default function AdminChat() {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChatRoomStatus>('OPEN');
  const [input, setInput] = useState('');
  const [roomsPage, setRoomsPage] = useState(0);
  const [roomsSize, setRoomsSize] = useState(20);
  const [roomsTotalPages, setRoomsTotalPages] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const isLive = selectedRoom?.status === 'OPEN';

  const { messages, connected, uploading, sendMessage, uploadAttachment } = useChat(selectedRoomId, {
    isAdmin: true,
    connectLive: isLive,
  });

  useEffect(() => {
    void loadRooms(roomsPage, roomsSize);
  }, [roomsPage, roomsSize]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setSelectedRoomId(null);
  }, [activeTab]);

  async function loadRooms(p: number, s: number) {
    const res = await getAdminChatRooms(p, s);
    if (res.code === 200 && res.data) {
      setRooms(res.data.content);
      setRoomsTotalPages(res.data.totalPages ?? 0);
    }
  }

  async function handleSelectRoom(room: ChatRoom) {
    if (room.status === 'OPEN' && room.adminId === null) {
      const res = await adminJoinRoom(room.id);
      if (res.code === 200 && res.data) {
        setRooms((prev) => prev.map((r) => (r.id === room.id ? res.data! : r)));
      }
    }
    setSelectedRoomId(room.id);
  }

  async function handleCloseRoom(roomId: string) {
    const res = await adminCloseRoom(roomId);
    if (res.code === 200 && res.data) {
      setSelectedRoomId(null);
      setActiveTab('CLOSED');
      void loadRooms(roomsPage, roomsSize);
    }
  }

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

  const filteredRooms = rooms.filter((r) => r.status === activeTab);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-7rem)] min-h-[480px] gap-3">
      <div
        className={`flex-col gap-2 lg:w-80 ${
          selectedRoom ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <h2 className="font-semibold text-lg">{t('admin.chat.roomList')}</h2>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ChatRoomStatus)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="OPEN" className="flex-1">
              {t('admin.chat.tab.open')}
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="flex-1">
              {t('admin.chat.tab.closed')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="flex-1 min-h-0 border rounded-lg">
          {filteredRooms.length === 0 && (
            <p className="text-center text-muted-foreground text-sm p-4">
              {activeTab === 'OPEN'
                ? t('admin.chat.empty.open')
                : t('admin.chat.empty.closed')}
            </p>
          )}
          {filteredRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleSelectRoom(room)}
              className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-accent transition-colors ${
                selectedRoomId === room.id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">
                  {t('admin.chat.userLabel')} #{room.userId}
                </span>
                <Badge
                  variant={room.status === 'OPEN' ? 'default' : 'secondary'}
                  className="text-xs shrink-0"
                >
                  {room.status === 'OPEN' ? t('admin.chat.status.open') : t('admin.chat.status.closed')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {room.adminId
                  ? `${t('admin.chat.assigned')} ${room.adminId}`
                  : t('admin.chat.unassigned')}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(room.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </ScrollArea>
        <div className="flex items-center justify-between pt-2 flex-wrap gap-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{t('admin.chat.pageSize')}</span>
            <Select
              value={String(roomsSize)}
              onValueChange={(v) => { setRoomsSize(Number(v)); setRoomsPage(0); }}
            >
              <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}{t('admin.chat.pageSizeSuffix')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={roomsPage <= 0} onClick={() => setRoomsPage((p) => p - 1)}>{t('admin.chat.prev')}</Button>
            <span className="text-xs text-muted-foreground">{roomsPage + 1} / {Math.max(1, roomsTotalPages)}</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={roomsPage >= roomsTotalPages - 1} onClick={() => setRoomsPage((p) => p + 1)}>{t('admin.chat.next')}</Button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 flex-col min-h-0 ${
          selectedRoom ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg">
            {t('admin.chat.selectRoom')}
          </div>
        ) : (
          <div className="flex-1 flex flex-col border rounded-lg overflow-hidden bg-card min-h-0">
            <div className="py-3 px-4 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-8 w-8"
                  onClick={() => setSelectedRoomId(null)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="font-semibold truncate">
                  {t('admin.chat.userLabel')} #{selectedRoom.userId}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isLive && (
                  <Badge
                    variant={connected ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {connected ? t('chat.connected') : t('chat.connecting')}
                  </Badge>
                )}
                {!isLive && (
                  <Badge variant="secondary" className="text-xs">
                    {t('chat.history.readonly')}
                  </Badge>
                )}
                {isLive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseRoom(selectedRoom.id)}
                  >
                    {t('admin.chat.close')}
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 bg-muted/30">
              <div className="p-3 sm:p-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    {t('chat.history.noMessages')}
                  </p>
                )}
                {messages.map((msg) => (
                  <ChatMessageBubble
                    key={msg.id}
                    msg={msg}
                    mineType="ADMIN"
                    otherLabel={t('admin.chat.userShort')}
                    fileLabel={t('chat.fileUnavailable')}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {isLive ? (
              <div className="p-3 border-t">
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
            ) : (
              <p className="text-center text-muted-foreground text-sm py-3 border-t">
                {t('admin.chat.closedRoom')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
