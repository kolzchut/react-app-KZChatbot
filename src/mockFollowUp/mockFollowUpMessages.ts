// MOCK PATCH — demo-only follow-up + static links. Delete the src/mockFollowUp folder to remove.
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType, MockFollowUpScenario } from '@/types';

// Bot-styled bubble carrying the follow-up question (plain text, no rating/links UI).
export const buildFollowUpQuestionMessage = (scenario: MockFollowUpScenario): Message => ({
  id: uuidv4(),
  type: MessageType.System,
  content: scenario.question,
});

// Echoes the user's affirmative reply as a normal user bubble.
export const buildUserAffirmativeMessage = (replyText: string): Message => ({
  id: uuidv4(),
  type: MessageType.User,
  content: replyText,
});

// Bot bubble that renders the scenario's static links via the existing link-card UI.
export const buildLinksMessage = (scenario: MockFollowUpScenario): Message => ({
  id: uuidv4(),
  type: MessageType.Bot,
  content: scenario.linksIntro,
  links: scenario.links,
});
