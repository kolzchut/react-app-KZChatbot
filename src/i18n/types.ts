// Type definition for all translatable strings in the chatbot
export interface ChatbotStrings {
  chat_description: string;
  chat_description_when_active_conversation: string;
  chat_icon: string;
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
  new_question_hint: string;
  new_conversation_button: string;
  previous_conversations_button: string;
  continue_conversation_placeholder: string;
  continue_conversation_mode_title: string;
  continue_conversation_mode_hint: string;
  return_to_conversation_button: string;
  delete_history_button: string;
  delete_history_modal_title: string;
  delete_history_modal_body: string;
  delete_history_confirm: string;
  delete_history_cancel: string;
  quota_reached_message: string;
  question_disclaimer: string;
  question_field: string;
  ranking_request: string;
  returning_links_title: string;
  returning_links_no_links: string;
  returning_links_empty: string;
  tc_link: string;
  welcome_message: string;
  feedback_character_limit: string;
  questions_daily_limit: string;
  question_character_limit: string;
  banned_word_found: string;
  general_error: string;
  send_button: string;
  chat_disclaimer: string;
  by: string;
  getting_answer: string;
}

export type StringKey = keyof ChatbotStrings;
