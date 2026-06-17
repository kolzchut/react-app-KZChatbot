export enum MessageType {
  StartBot = "startBot",
  Bot = "bot",
  User = "user",
  Warning = "warning",
  Error = "error",
  System = "system",
}

export type SystemAction = "quota_reached" | "new_conversation";

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  conversationId?: string;
  /** RAG thread id this message belongs to; set on bot answers for rating. */
  threadId?: string;
  timestamp?: number;
  systemAction?: SystemAction;
  links?: { title: string; url: string }[];
  isFirstQuestion?: boolean;
  liked?: boolean | null;
  /** Whether the user submitted the free-text feedback form (survives remounts). */
  feedbackSubmitted?: boolean;
  formattedContent?: boolean;
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
  /** RAG thread id echoed by the backend; used to carry continuous-conversation state. */
  threadId: string;
}

export type Errors = {
  [key: string]: string;
};
