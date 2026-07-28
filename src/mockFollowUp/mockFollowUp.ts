// MOCK PATCH — demo-only follow-up + static links. Delete the src/mockFollowUp folder to remove.
// Facade the main flow calls: all matching + guards live here, components stay dumb.
import { Message, MockFollowUpScenario, MockFollowUpTurn } from '@/types';
import {
  detectScenarioFromPrompt,
  isAffirmativeReply,
  isRegionQuestionText,
  matchScenarioToFollowUpQuestion,
} from './mockFollowUpLogic';
import {
  buildFollowUpQuestionMessage,
  buildLinksMessage,
  buildRegionQuestionMessage,
  buildUserReplyMessage,
} from './mockFollowUpMessages';

// After a bot answer: the follow-up question message when the prompt matched a scenario, else null.
export const getFollowUpQuestionForPrompt = (promptText: string): Message | null => {
  const scenario = detectScenarioFromPrompt(promptText);
  return scenario ? buildFollowUpQuestionMessage(scenario) : null;
};

// The scenario this conversation is running, taken from the most recent follow-up question asked.
// Needed because the region question text is shared and cannot identify a scenario on its own.
const findConversationScenario = (messages: Message[]): MockFollowUpScenario | null =>
  [...messages]
    .reverse()
    .map((message) => matchScenarioToFollowUpQuestion(message.content))
    .find(Boolean) || null;

const getLastMessageContent = (messages: Message[]): string =>
  messages[messages.length - 1]?.content || '';

// On submit, the demo answers in two steps and skips the backend for both:
// offer just asked + affirmative reply -> ask for the region; region just asked -> any reply shows the links.
export const getMockFollowUpTurn = (replyText: string, messages: Message[]): MockFollowUpTurn | null => {
  const scenario = findConversationScenario(messages);
  if (!scenario) return null;

  const lastMessageContent = getLastMessageContent(messages);
  if (matchScenarioToFollowUpQuestion(lastMessageContent) && isAffirmativeReply(replyText)) {
    return { userMessage: buildUserReplyMessage(replyText), botMessage: buildRegionQuestionMessage() };
  }
  if (isRegionQuestionText(lastMessageContent)) {
    return { userMessage: buildUserReplyMessage(replyText), botMessage: buildLinksMessage(scenario) };
  }
  return null;
};
