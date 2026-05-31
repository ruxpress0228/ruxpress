import { useCallback, useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { STORAGE_KEYS, USER_AUTH_CHANGE_EVENT } from '@/utils/constants';
import { readAuthValue } from '@/utils/api';
import type { ChatMessage } from '@/types/chat';
import { getChatMessages, getAdminRoomMessages, uploadChatAttachment, uploadAdminChatAttachment } from '@/api/chat';

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

function appendUnique(prev: ChatMessage[], chatMsg: ChatMessage): ChatMessage[] {
  if (prev.some((m) => m.id === chatMsg.id)) return prev;
  return [...prev, chatMsg];
}

interface UseChatOptions {
  isAdmin?: boolean;
  connectLive?: boolean;
}

export function useChat(roomId: string | null, options: UseChatOptions = {}) {
  const { isAdmin = false, connectLive = true } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authToken, setAuthToken] = useState(() => readAuthValue(STORAGE_KEYS.TOKEN));
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const syncToken = () => setAuthToken(readAuthValue(STORAGE_KEYS.TOKEN));
    syncToken();
    window.addEventListener(USER_AUTH_CHANGE_EVENT, syncToken);
    return () => window.removeEventListener(USER_AUTH_CHANGE_EVENT, syncToken);
  }, []);

  useEffect(() => {
    setMessages([]);
    if (!roomId) return;
    const fetch = isAdmin ? getAdminRoomMessages : getChatMessages;
    fetch(roomId).then((res) => {
      if (res.code === 200 && res.data) setMessages(res.data);
    });
  }, [roomId, isAdmin]);

  useEffect(() => {
    if (!roomId || !connectLive) {
      setConnected(false);
      return;
    }
    if (!authToken) {
      setConnected(false);
      return;
    }

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: { Authorization: `Bearer ${authToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (msg: IMessage) => {
          const chatMsg = JSON.parse(msg.body) as ChatMessage;
          setMessages((prev) => appendUnique(prev, chatMsg));
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message'], frame.body);
        setConnected(false);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error', event);
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId, connectLive, authToken]);

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current?.connected || !roomId || !connectLive) return;
    clientRef.current.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  }, [roomId, connectLive]);

  const uploadAttachment = useCallback(async (file: File, caption?: string) => {
    if (!roomId || !connectLive) return;
    setUploading(true);
    try {
      const upload = isAdmin ? uploadAdminChatAttachment : uploadChatAttachment;
      const message = await upload(roomId, file, caption);
      setMessages((prev) => appendUnique(prev, message));
    } catch (err) {
      setUploading(false);
      throw err;
    }
    setUploading(false);
  }, [roomId, connectLive, isAdmin]);

  const reloadMessages = useCallback(async () => {
    if (!roomId) return;
    const fetch = isAdmin ? getAdminRoomMessages : getChatMessages;
    const res = await fetch(roomId);
    if (res.code === 200 && res.data) setMessages(res.data);
  }, [roomId, isAdmin]);

  return { messages, connected, uploading, sendMessage, uploadAttachment, reloadMessages };
}
