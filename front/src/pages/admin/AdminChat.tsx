import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  getAdminChatRooms,
  adminJoinRoom,
  adminCloseRoom,
} from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChatRoom, ChatRoomStatus } from '@/types/chat';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AdminChat() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChatRoomStatus>('OPEN');
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const isLive = selectedRoom?.status === 'OPEN';

  const { messages, connected, sendMessage } = useChat(selectedRoomId, {
    isAdmin: true,
    connectLive: isLive,
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setSelectedRoomId(null);
  }, [activeTab]);

  async function loadRooms() {
    const res = await getAdminChatRooms(0, 100);
    if (res.code === 200 && res.data) setRooms(res.data.content);
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
      setRooms((prev) => prev.map((r) => (r.id === roomId ? res.data! : r)));
      setSelectedRoomId(null);
      setActiveTab('CLOSED');
    }
  }

  const handleSend = () => {
    const text = input.trim();
    if (!text || !connected) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredRooms = rooms.filter((r) => r.status === activeTab);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-7rem)] min-h-[480px] gap-3">
      {/* Room list */}
      <div
        className={`flex-col gap-2 lg:w-80 ${
          selectedRoom ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <h2 className="font-semibold text-lg">채팅 목록</h2>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ChatRoomStatus)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="OPEN" className="flex-1">
              진행중
            </TabsTrigger>
            <TabsTrigger value="CLOSED" className="flex-1">
              종료
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="flex-1 min-h-0 border rounded-lg">
          {filteredRooms.length === 0 && (
            <p className="text-center text-muted-foreground text-sm p-4">
              {activeTab === 'OPEN'
                ? '진행중인 채팅이 없습니다'
                : '종료된 채팅이 없습니다'}
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
                  사용자 #{room.userId}
                </span>
                <Badge
                  variant={room.status === 'OPEN' ? 'default' : 'secondary'}
                  className="text-xs shrink-0"
                >
                  {room.status === 'OPEN' ? '진행중' : '종료'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {room.adminId ? `담당: ${room.adminId}` : '미배정'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(room.updatedAt).toLocaleString()}
              </p>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div
        className={`flex-1 flex-col min-h-0 ${
          selectedRoom ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {!selectedRoom ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground border rounded-lg">
            채팅방을 선택하세요
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
                  사용자 #{selectedRoom.userId}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isLive && (
                  <Badge
                    variant={connected ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {connected ? '연결됨' : '연결중...'}
                  </Badge>
                )}
                {!isLive && (
                  <Badge variant="secondary" className="text-xs">
                    조회 전용
                  </Badge>
                )}
                {isLive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseRoom(selectedRoom.id)}
                  >
                    종료
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 bg-muted/30">
              <div className="p-3 sm:p-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    메시지가 없습니다
                  </p>
                )}
                {messages.map((msg) => {
                  // Admin view: admin messages (mine) on the right, user on the left
                  const isMine = msg.senderType === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex mb-3 ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm break-words ${
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border'
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-medium mb-1 opacity-60">
                            사용자
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {isLive ? (
              <div className="p-3 border-t flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지 입력..."
                  disabled={!connected}
                  maxLength={2000}
                />
                <Button
                  onClick={handleSend}
                  disabled={!connected || !input.trim()}
                >
                  전송
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-3 border-t">
                종료된 채팅방입니다
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
