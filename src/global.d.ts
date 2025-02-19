declare global {
  interface Window {
    KZChatbotConfig: {
      uuid: string;
      chatbotIsShown: boolean;
      cookieExpiry: string;
      feedbackCharacterLimit: number;
      questionCharacterLimit: number;
      questionsPermitted: number;
      termsofServiceUrl: string;
      usageHelpUrl: string;
      referrer: string;
      slugs: {
        chat_icon: string;
        chat_description: string;
        chat_tip_link: string;
        open_chat_icon: string;
        close_chat_icon: string;
        dislike_follow_up_question: string;
        like_follow_up_question: string;
        dislike_free_text: string;
        like_free_text: string;
        feedback_free_text_disclaimer: string;
        new_question_button: string;
        new_question_filed: string;
        question_disclaimer: string;
        question_field: string;
        ranking_request: string;
        returning_links_title: string;
        tc_link: string;
        welcome_message_first: string;
        welcome_message_second: string;
        welcome_message_third: string;
        feedback_character_limit: string;
        questions_daily_limit: string;
        question_character_limit: string;
        banned_word_found: string;
        general_error: string;
        send_button: string;
        new_question_hint: string;
      };
      restPath: string;
    };
  }
}

export {};
