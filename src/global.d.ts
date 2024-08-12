declare global {
  interface Window {
    KZChatbotConfig: {
      uuid: string;
      chatbotIsShown: "0" | "1";
      cookieExpiry: string;
      slugs: { [key: string]: string };
      restPath: string;
    };
  }
}

export {};
