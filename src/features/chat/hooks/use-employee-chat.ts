import { useAuth, useUser } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Channel, StreamChat } from 'stream-chat';

import { requestChatBotMessage } from '@/features/chat/api/request-bot-message';
import { requestChatSession } from '@/features/chat/api/request-chat-session';
import { mapStreamMessage } from '@/features/chat/lib/map-stream-message';
import {
  replaceLocalWithStream,
  upsertChatMessage,
} from '@/features/chat/lib/merge-chat-messages';
import type { ChatBubble, ChatSessionCredentials } from '@/features/chat/types';
import { streamTalkBrain } from '@/features/talk';

export type EmployeeChatStatus = 'idle' | 'connecting' | 'ready' | 'sending' | 'error';

export function useEmployeeChat(
  employeeId: string | null,
  threadId: string | null = null,
) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const clientRef = useRef<StreamChat | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const credentialsRef = useRef<ChatSessionCredentials | null>(null);
  const connectGenRef = useRef(0);
  const [status, setStatus] = useState<EmployeeChatStatus>('idle');
  const [credentials, setCredentials] = useState<ChatSessionCredentials | null>(null);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Stream thread id — null/main uses the private main channel. */
  const streamThreadId =
    threadId && threadId !== 'main' ? threadId : null;

  const tearDownChannel = useCallback(async () => {
    try {
      const channel = channelRef.current;
      channel?.off('message.new');
      channel?.off('message.updated');
      channel?.off('message.deleted');
      await channel?.stopWatching();
    } catch {
      // ignore
    }
    channelRef.current = null;
  }, []);

  const disconnectUser = useCallback(async () => {
    await tearDownChannel();
    try {
      if (clientRef.current?.userID) {
        await clientRef.current.disconnectUser();
      }
    } catch {
      // ignore
    }
    clientRef.current = null;
    credentialsRef.current = null;
    setCredentials(null);
    setMessages([]);
  }, [tearDownChannel]);

  const connect = useCallback(async () => {
    if (!employeeId) return;

    const gen = ++connectGenRef.current;
    setError(null);
    setStatus('connecting');

    try {
      await tearDownChannel();

      const session = await requestChatSession({
        getToken,
        employeeId,
        userName: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
        threadId: streamThreadId,
        title: streamThreadId ? 'New chat' : undefined,
      });

      if (gen !== connectGenRef.current) return;

      const { StreamChat } = await import('stream-chat');
      const client = StreamChat.getInstance(session.apiKey, undefined, {
        timeout: 15000,
      });

      if (client.userID && client.userID !== session.userId) {
        await client.disconnectUser();
      }
      if (!client.userID) {
        await client.connectUser(
          { id: session.userId, name: session.userName },
          session.token,
        );
      }

      if (gen !== connectGenRef.current) return;

      const channel = client.channel(session.channelType, session.channelId);
      await channel.watch();

      if (gen !== connectGenRef.current) return;

      const history = (channel.state.messages ?? [])
        .map((message) => mapStreamMessage(message, session.botUserId))
        .filter((item): item is ChatBubble => item !== null)
        .filter((item, index, all) => all.findIndex((m) => m.id === item.id) === index);

      const onNew = (event: { message?: Parameters<typeof mapStreamMessage>[0] }) => {
        const mapped = mapStreamMessage(event.message ?? {}, session.botUserId);
        if (!mapped) return;
        setMessages((prev) => upsertChatMessage(prev, mapped));
      };

      const onUpdated = (event: { message?: Parameters<typeof mapStreamMessage>[0] }) => {
        const mapped = mapStreamMessage(event.message ?? {}, session.botUserId);
        if (!mapped) return;
        setMessages((prev) =>
          prev.map((item) => (item.id === mapped.id ? { ...mapped, pending: false } : item)),
        );
      };

      const onDeleted = (event: { message?: { id?: string } }) => {
        const id = event.message?.id;
        if (!id) return;
        setMessages((prev) => prev.filter((item) => item.id !== id));
      };

      channel.on('message.new', onNew);
      channel.on('message.updated', onUpdated);
      channel.on('message.deleted', onDeleted);

      clientRef.current = client;
      channelRef.current = channel;
      credentialsRef.current = session;
      setCredentials(session);
      setMessages(history);
      setStatus('ready');
    } catch (err) {
      if (gen !== connectGenRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to connect chat';
      setError(message);
      setStatus('error');
      await tearDownChannel();
    }
  }, [
    employeeId,
    streamThreadId,
    getToken,
    tearDownChannel,
    user?.fullName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  const send = useCallback(
    async (text: string) => {
      const channel = channelRef.current;
      const session = credentialsRef.current;
      if (!channel || !session) return false;

      const content = text.trim();
      if (!content) return false;

      setError(null);
      setStatus('sending');

      const localId = `local-${Date.now()}`;
      const optimistic: ChatBubble = {
        id: localId,
        text: content,
        role: 'user',
        createdAt: new Date().toISOString(),
        pending: true,
      };

      let historySnapshot: ChatBubble[] = [];
      setMessages((prev) => {
        historySnapshot = [...prev, optimistic];
        return historySnapshot;
      });

      try {
        const response = await channel.sendMessage({ text: content });
        const confirmed = mapStreamMessage(response.message, session.botUserId);
        if (confirmed) {
          setMessages((prev) => replaceLocalWithStream(prev, localId, confirmed));
          historySnapshot = historySnapshot.map((item) =>
            item.id === localId ? confirmed : item,
          );
        }

        const reply = await streamTalkBrain({
          getToken,
          employeeId: session.employeeId,
          channel: 'chat',
          messages: historySnapshot.map((item) => ({
            role: item.role === 'user' ? 'user' : 'persona',
            content: item.text,
          })),
        });

        await requestChatBotMessage({
          getToken,
          employeeId: session.employeeId,
          channelId: session.channelId,
          text: reply,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
          userName: user?.fullName ?? null,
        });

        setStatus('ready');
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        setMessages((prev) => prev.filter((item) => item.id !== localId));
        setStatus('ready');
        return false;
      }
    },
    [getToken, user?.fullName, user?.primaryEmailAddress?.emailAddress],
  );

  const updateMessage = useCallback(async (messageId: string, text: string) => {
    const client = clientRef.current;
    if (!client) return false;

    const next = text.trim();
    if (!next || messageId.startsWith('local-')) return false;

    let previous: ChatBubble | null = null;
    setMessages((prev) => {
      previous = prev.find((item) => item.id === messageId) ?? null;
      return prev.map((item) =>
        item.id === messageId
          ? {
              ...item,
              text: next,
              pending: true,
              updatedAt: new Date().toISOString(),
            }
          : item,
      );
    });

    try {
      await client.updateMessage({
        id: messageId,
        text: next,
      });
      setMessages((prev) =>
        prev.map((item) =>
          item.id === messageId ? { ...item, pending: false } : item,
        ),
      );
      return true;
    } catch (err) {
      if (previous) {
        const rollback = previous;
        setMessages((prev) =>
          prev.map((item) => (item.id === messageId ? rollback : item)),
        );
      }
      setError(err instanceof Error ? err.message : 'Could not edit message');
      return false;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const client = clientRef.current;
    if (!client || messageId.startsWith('local-')) return false;

    let snapshot: ChatBubble[] = [];
    setMessages((prev) => {
      snapshot = prev;
      return prev.filter((item) => item.id !== messageId);
    });

    try {
      await client.deleteMessage(messageId);
      return true;
    } catch (err) {
      setMessages(snapshot);
      setError(err instanceof Error ? err.message : 'Could not delete message');
      return false;
    }
  }, []);

  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  useEffect(() => {
    if (!employeeId) {
      setStatus('idle');
      return;
    }

    void connect();

    return () => {
      connectGenRef.current += 1;
      void tearDownChannel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, email, streamThreadId]);

  useEffect(() => {
    return () => {
      connectGenRef.current += 1;
      void disconnectUser();
    };
  }, [disconnectUser]);

  return {
    status,
    error,
    messages,
    credentials,
    connect,
    disconnect: disconnectUser,
    send,
    updateMessage,
    deleteMessage,
  };
}
