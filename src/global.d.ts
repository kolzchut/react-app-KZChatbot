declare global {
  interface Window {
    KZChatbotConfig: {
      uuid: string;
      chatbotIsShown: "0" | "1";
      cookieExpiry: string;
      slugs: {
        chat_icon: string;
        chat_tip_link: string;
        close_chat_icon: string;
        dislike_follow_up_question: string;
        dislike_followup_q_first: string;
        dislike_followup_q_second: string;
        dislike_followup_q_third: string;
        feedback_free_text: string;
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
      };
      restPath: string;
    };
  }
}

export {};
