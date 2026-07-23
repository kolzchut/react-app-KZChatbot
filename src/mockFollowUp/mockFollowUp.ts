// MOCK PATCH — demo-only follow-up + static links. Delete the src/mockFollowUp folder to remove.
// Facade the main flow calls: all matching + guards live here, components stay dumb.
import { Message } from '@/types';
import { detectScenarioFromPrompt, isAffirmativeReply, matchScenarioToFollowUpQuestion } from './mockFollowUpLogic';
import { buildFollowUpQuestionMessage, buildLinksMessage, buildUserAffirmativeMessage } from './mockFollowUpMessages';

// After a bot answer: the follow-up question message when the prompt matched a scenario, else null.
export const getFollowUpQuestionForPrompt = (promptText: string): Message | null => {
  const scenario = detectScenarioFromPrompt(promptText);
  return scenario ? buildFollowUpQuestionMessage(scenario) : null;
};

// The scenario armed by the conversation, iff our follow-up question is the last bot bubble.
const getArmedScenario = (messages: Message[]) => {
  const lastMessage = messages[messages.length - 1];
  return lastMessage ? matchScenarioToFollowUpQuestion(lastMessage.content) : null;
};

// On submit: links messages only when a follow-up question was just asked AND the reply is affirmative.
export const getAffirmativeLinksMessages = (
  replyText: string,
  messages: Message[],
): { userMessage: Message; linksMessage: Message } | null => {
  const scenario = getArmedScenario(messages);
  if (!scenario || !isAffirmativeReply(replyText)) return null;
  return { userMessage: buildUserAffirmativeMessage(replyText), linksMessage: buildLinksMessage(scenario) };
};
