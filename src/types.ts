export enum MessageType {
  StartBot = "startBot",
  Bot = "bot",
  User = "user",
  Warning = "warning",
  Error = "error",
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  links?: { title: string; url: string }[];
  isFirstQuestion?: boolean;
  liked?: boolean | null;
}

export enum ButtonType {
  ThumbsUp = "thumbsUp",
  ThumbsDown = "thumbsDown",
}

interface Document {
  title: string;
  url: string;
}

export interface Answer {
  llmResult: string;
  docs: Document[];
  conversationId: string;
}

export type Errors = {
  [key: string]: string;
};
