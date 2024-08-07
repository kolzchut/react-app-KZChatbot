export enum MessageType {
  StartBot = "startBot",
  Bot = "bot",
  User = "user",
}

export interface Message {
  id: number;
  content: string;
  type: MessageType;
  links?: { title: string; url: string }[];
  isFirstQuestion?: boolean;
}

export enum ButtonType {
  ThumbsUp = "thumbsUp",
  ThumbsDown = "thumbsDown",
}
