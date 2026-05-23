import { useEffect, useRef, useState } from 'react';
import { Client, type IMessage } from '@stomp/stompjs';
import { STORAGE_KEYS } from '@/utils/constants';
import { readAuthValue } from '@/utils/api';
import type { ChatMessage } from '@/types/chat';
import { getChatMessages, getAdminRoomMessages } from '@/api/chat';

function buildWsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

interface UseChatOptions {
  isAdmin?: boolean;
  /** When false, only history is loaded (no WebSocket connection). Default true. */
  connectLive?: boolean;
}

export function useChat(roomId: string | null, options: UseChatOptions = {}) {
  const { isAdmin = false, connectLive = true } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Load history whenever the room changes
  useEffect(() => {
    setMessages([]);
    if (!roomId) return;
    const fetch = isAdmin ? getAdminRoomMessages : getChatMessages;
    fetch(roomId).then((res) => {
      if (res.code === 200 && res.data) setMessages(res.data);
    });
  }, [roomId, isAdmin]);

  // Open WebSocket only for live rooms
  useEffect(() => {
    if (!roomId || !connectLive) {
      setConnected(false);
      return;
    }
    const token = readAuthValue(STORAGE_KEYS.TOKEN);
    if (!token) return;

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/chat/${roomId}`, (msg: IMessage) => {
          const chatMsg = JSON.parse(msg.body) as ChatMessage;
          setMessages((prev) => [...prev, chatMsg]);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomId, connectLive]);

  const sendMessage = (content: string) => {
    if (!clientRef.current?.connected || !roomId || !connectLive) return;
    clientRef.current.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify({ content }),
    });
  };

  return { messages, connected, sendMessage };
}
