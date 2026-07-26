export type ChatSessionCredentials = {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  channelType: 'messaging';
  channelId: string;
  employeeId: string;
  employeeName: string;
  botUserId: string;
};

export type ChatBubble = {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  createdAt: string;
  /** Optimistic send / edit in flight */
  pending?: boolean;
  updatedAt?: string;
};
