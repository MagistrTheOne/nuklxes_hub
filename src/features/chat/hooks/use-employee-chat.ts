import { useAuth, useUser } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Channel, StreamChat } from 'stream-chat';

import { requestChatBotMessage } from '@/features/chat/api/request-bot-message';
import { requestChatSession } from '@/features/chat/api/request-chat-session';
import { mapStreamMessage } from '@/features/chat/lib/map-stream-message';
import type { ChatBubble, ChatSessionCredentials } from '@/features/chat/types';
import { streamTalkBrain } from '@/features/talk';

export type EmployeeChatStatus = 'idle' | 'connecting' | 'ready' | 'sending' | 'error';

export function useEmployeeChat(employeeId: string | null) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const clientRef = useRef<StreamChat | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const [status, setStatus] = useState<EmployeeChatStatus>('idle');
  const [credentials, setCredentials] = useState<ChatSessionCredentials | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [error, setError] = useState<string | null>(null);

  const disconnect = useCallback(async () => {
    try {
      channelRef.current?.off('message.new');
      await channelRef.current?.stopWatching();
    } catch {
      // ignore
    }
    channelRef.current = null;

    try {
      await clientRef.current?.disconnectUser();
    } catch {
      // ignore
    }
    clientRef.current = null;
    setCredentials(null);
    setMessages([]);
    setStatus('idle');
  }, []);

  const connect = useCallback(async () => {
    if (!employeeId) return;

    setError(null);
    setStatus('connecting');

    try {
      await disconnect();

      const session = await requestChatSession({
        getToken,
        employeeId,
        userName: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
      });

      const { StreamChat } = await import('stream-chat');
      const client = StreamChat.getInstance(session.apiKey);
      await client.connectUser(
        { id: session.userId, name: session.userName },
        session.token,
      );

      const channel = client.channel(session.channelType, session.channelId);
      await channel.watch();

      const history = (channel.state.messages ?? [])
        .map((message) => mapStreamMessage(message, session.botUserId))
        .filter((item): item is ChatBubble => item !== null);

      channel.on('message.new', (event) => {
        const mapped = mapStreamMessage(event.message ?? {}, session.botUserId);
        if (!mapped) return;
        setMessages((prev) => {
          if (prev.some((item) => item.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
      });

      clientRef.current = client;
      channelRef.current = channel;
      setCredentials(session);
      setMessages(history);
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect chat';
      setError(message);
      setStatus('error');
      await disconnect();
    }
  }, [disconnect, employeeId, getToken, user?.fullName, user?.primaryEmailAddress?.emailAddress]);

  const send = useCallback(
    async (text: string) => {
      const channel = channelRef.current;
      const session = credentials;
      if (!channel || !session || status === 'sending') return;

      const content = text.trim();
      if (!content) return;

      setError(null);
      setStatus('sending');

      try {
        await channel.sendMessage({ text: content });

        const historyForBrain = [...messages, {
          id: 'pending',
          text: content,
          role: 'user' as const,
          createdAt: new Date().toISOString(),
        }];

        const reply = await streamTalkBrain({
          getToken,
          employeeId: session.employeeId,
          channel: 'chat',
          messages: historyForBrain.map((item) => ({
            role: item.role === 'user' ? 'user' : 'persona',
            content: item.text,
          })),
        });

        await requestChatBotMessage({
          getToken,
          employeeId: session.employeeId,
          channelId: session.channelId,
          text: reply,
        });

        setStatus('ready');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        setStatus('ready');
      }
    },
    [credentials, getToken, messages, status],
  );

  useEffect(() => {
    setCredentials(null);
    setMessages([]);
    setStatus('idle');
    setError(null);

    return () => {
      void (async () => {
        try {
          channelRef.current?.off('message.new');
          await channelRef.current?.stopWatching();
        } catch {
          // ignore
        }
        channelRef.current = null;
        try {
          await clientRef.current?.disconnectUser();
        } catch {
          // ignore
        }
        clientRef.current = null;
      })();
    };
  }, [employeeId]);

  return {
    status,
    error,
    messages,
    credentials,
    connect,
    disconnect,
    send,
  };
}
