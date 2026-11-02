import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import {
  getAdminChatRooms,
  adminJoinRoom,
  adminCloseRoom,
  getChatCleanupSettings,
  updateChatCleanupSettings,
} from '@/api/chat';
import { useChat } from '@/hooks/chat/useChat';
import { useTranslation } from '@/hooks/useTranslation';
import { readAuthValue } from '@/utils/api';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/components/ui/utils';
import { PageHeader, Pager } from '@/components/page';
import { ChatDaySeparator, ChatMessageBubble, startsNewDay } from '@/components/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/chat/ChatInputBar';
import { toast } from 'sonner';
import type { ChatRoom, ChatRoomStatus, ChatCleanupSettings, ChatRetentionPeriod } from '@/types/chat';

const ROOM_LIST_POLL_MS = 15_000;
const ADMIN_STORAGE_KEY = 'ruxpress_admin';
const DAY_LABEL: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };

function readAdminRole(): string | null {
  try {
    const raw = readAuthValue(ADMIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { role?: string }).role ?? null : null;
  } catch {
    return null;
  }
}

export default function AdminChat() {
  const { t, locale } = useTranslation();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ChatRoomStatus>('OPEN');
  const [input, setInput] = useState('');
  const [roomsPage, setRoomsPage] = useState(0);
  const [roomsSize, setRoomsSize] = useState(DEFAULT_PAGE_SIZE);
  const [roomsTotalPages, setRoomsTotalPages] = useState(0);
  const [roomsRefreshing, setRoomsRefreshing] = useState(false);
  const [cleanupSettings, setCleanupSettings] = useState<ChatCleanupSettings | null>(null);
  const [retentionSaving, setRetentionSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSuperAdmin = readAdminRole() === 'SUPER_ADMIN';

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;
  const isLive = selectedRoom?.status === 'OPEN';

  const { messages, connected, uploading, sendMessage, uploadAttachment, reloadMessages } = useChat(selectedRoomId, {
    isAdmin: true,
    connectLive: isLive,
  });

  const loadRooms = useCallback(async (p: number, s: number) => {
    const res = await getAdminChatRooms(p, s);
    if (res.code === 200 && res.data) {
      setRooms(res.data.content);
      setRoomsTotalPages(res.data.totalPages ?? 0);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    void loadRooms(roomsPage, roomsSize);
  }, [roomsPage, roomsSize, loadRooms]);

  useEffect(() => {
    if (activeTab !== 'OPEN') return;
    const timer = setInterval(() => {
      void loadRooms(roomsPage, roomsSize);
    }, ROOM_LIST_POLL_MS);
    return () => clearInterval(timer);
  }, [activeTab, roomsPage, roomsSize, loadRooms]);

  useEffect(() => {
    getChatCleanupSettings().then((res) => {
      if (res.code === 200 && res.data) setCleanupSettings(res.data);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setSelectedRoomId(null);
  }, [activeTab]);

  const handleRefresh = async () => {
    setRoomsRefreshing(true);
    try {
      const ok = await loadRooms(roomsPage, roomsSize);
      if (selectedRoomId) await reloadMessages();
      if (ok) toast.success(t('admin.chat.refreshDone'));
      else toast.error(t('admin.chat.refreshError'));
    } catch {
      toast.error(t('admin.chat.refreshError'));
    } finally {
      setRoomsRefreshing(false);
    }
  };

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

  const handleRetentionChange = async (value: ChatRetentionPeriod) => {
    if (!isSuperAdmin) return;
    setRetentionSaving(true);
    try {
      const res = await updateChatCleanupSettings(value);
      if (res.code === 200 && res.data) {
        setCleanupSettings(res.data);
        toast.success(t('admin.chat.retention.saved'));
      } else {
        toast.error(t('admin.chat.retention.saveError'));
      }
    } catch {
      toast.error(t('admin.chat.retention.saveError'));
    } finally {
      setRetentionSaving(false);
    }
  };

  const filteredRooms = rooms.filter((r) => r.status === activeTab);

  const dayLabel = (iso: string) => formatDate(iso, locale, DAY_LABEL);

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[30rem] flex-col">
      <PageHeader
        title={t('admin.chat.roomList')}
        className="mb-5 md:mb-6"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={roomsRefreshing}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw className={cn('size-4', roomsRefreshing && 'animate-spin')} strokeWidth={1.5} aria-hidden />
            {t('admin.chat.refresh')}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 border border-border">
        {/* Conversation list */}
        <aside
          className={cn(
            'w-full min-w-0 flex-col md:w-80 md:shrink-0 md:border-r md:border-border',
            selectedRoom ? 'hidden md:flex' : 'flex',
          )}
        >
          <div className="border-b border-border p-3">
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
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredRooms.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {activeTab === 'OPEN'
                  ? t('admin.chat.empty.open')
                  : t('admin.chat.empty.closed')}
              </p>
            )}
            <ul>
              {filteredRooms.map((room) => {
                const selected = selectedRoomId === room.id;
                return (
                  <li key={room.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectRoom(room)}
                      aria-current={selected ? 'true' : undefined}
                      className={cn(
                        'block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/60',
                        selected && 'bg-muted',
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="min-w-0 truncate text-sm font-medium">
                          {t('admin.chat.userLabel')} <span className="figure">#{room.userId}</span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground figure">
                          {formatDate(room.updatedAt, locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-xs text-muted-foreground">
                          {room.adminId
                            ? `${t('admin.chat.assigned')} ${room.adminId}`
                            : t('admin.chat.unassigned')}
                        </span>
                        <Badge
                          variant={room.status === 'OPEN' ? 'default' : 'secondary'}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {room.status === 'OPEN' ? t('admin.chat.status.open') : t('admin.chat.status.closed')}
                        </Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-border px-3 pb-3">
            <div className="flex items-center justify-between gap-3 pt-3">
              <label htmlFor="admin-chat-page-size" className="text-xs font-normal text-muted-foreground">
                {t('admin.chat.pageSize')}
              </label>
              <Select
                value={String(roomsSize)}
                onValueChange={(v) => { setRoomsSize(Number(v)); setRoomsPage(0); }}
              >
                <SelectTrigger id="admin-chat-page-size" size="sm" className="w-[4.5rem] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}{t('admin.chat.pageSizeSuffix')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pager
              page={roomsPage}
              totalPages={roomsTotalPages}
              onPrev={() => setRoomsPage((p) => p - 1)}
              onNext={() => setRoomsPage((p) => p + 1)}
              prevLabel={t('admin.chat.prev')}
              nextLabel={t('admin.chat.next')}
              className="pt-2"
            />
          </div>

          <div className="border-t border-border p-3">
            <label htmlFor="admin-chat-retention" className="block text-xs font-medium">
              {t('admin.chat.retention.title')}
            </label>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t('admin.chat.retention.desc')}</p>
            <Select
              value={cleanupSettings?.retentionPeriod ?? 'PERMANENT'}
              onValueChange={(v) => void handleRetentionChange(v as ChatRetentionPeriod)}
              disabled={!isSuperAdmin || retentionSaving || !cleanupSettings}
            >
              <SelectTrigger id="admin-chat-retention" size="sm" className="mt-2 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(cleanupSettings?.options ?? [{ value: 'PERMANENT', months: 0 }]).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(`admin.chat.retention.${opt.value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isSuperAdmin && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">{t('admin.chat.retention.superOnly')}</p>
            )}
          </div>
        </aside>

        {/* Conversation */}
        <div className={cn('min-w-0 flex-1 flex-col', selectedRoom ? 'flex' : 'hidden md:flex')}>
          {!selectedRoom ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <MessageSquare className="size-6 text-muted-foreground" strokeWidth={1.25} aria-hidden />
              <p className="text-sm text-muted-foreground">{t('admin.chat.selectRoom')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border py-2 pl-2 pr-3 md:px-4 md:py-3">
                <div className="flex min-w-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedRoomId(null)}
                    title={t('chat.history.back')}
                    aria-label={t('chat.history.back')}
                  >
                    <ArrowLeft className="size-4" strokeWidth={1.5} />
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t('admin.chat.userLabel')} <span className="figure">#{selectedRoom.userId}</span>
                    </p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          isLive && connected ? 'bg-foreground' : 'bg-muted-foreground/40',
                        )}
                        aria-hidden
                      />
                      {isLive
                        ? connected
                          ? t('chat.connected')
                          : t('chat.connecting')
                        : t('chat.history.readonly')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={roomsRefreshing}
                    title={t('admin.chat.refresh')}
                    aria-label={t('admin.chat.refresh')}
                    onClick={() => void handleRefresh()}
                  >
                    <RefreshCw className={cn('size-4', roomsRefreshing && 'animate-spin')} strokeWidth={1.5} />
                  </Button>
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

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {t('chat.history.noMessages')}
                  </p>
                )}
                {messages.map((msg, i) => (
                  <Fragment key={msg.id}>
                    {startsNewDay(messages[i - 1], msg) && <ChatDaySeparator label={dayLabel(msg.createdAt)} />}
                    <ChatMessageBubble
                      msg={msg}
                      mineType="ADMIN"
                      otherLabel={t('admin.chat.userShort')}
                      fileLabel={t('chat.fileUnavailable')}
                    />
                  </Fragment>
                ))}
                <div ref={bottomRef} />
              </div>

              {isLive ? (
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
              ) : (
                <p className="border-t border-border px-4 py-3 text-center text-sm text-muted-foreground">
                  {t('admin.chat.closedRoom')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
