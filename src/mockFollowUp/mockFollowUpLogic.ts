// MOCK PATCH — demo-only follow-up + static links. Delete the src/mockFollowUp folder to remove.
import { MockFollowUpScenario } from '@/types';
import mockFollowUpData from './mockFollowUp.json';

const scenarios = mockFollowUpData.scenarios as MockFollowUpScenario[];
const affirmativeToken = mockFollowUpData.affirmativeToken;

// Which scenario (if any) a user prompt triggers — matched by "contain".
export const detectScenarioFromPrompt = (promptText: string): MockFollowUpScenario | null =>
  scenarios.find((scenario) => promptText.includes(scenario.promptMatch)) || null;

// Whether a reply counts as affirmative — the token may appear anywhere in the text.
export const isAffirmativeReply = (replyText: string): boolean =>
  replyText.includes(affirmativeToken);

// Which scenario a bot bubble corresponds to, iff its text is one of our follow-up questions.
export const matchScenarioToFollowUpQuestion = (botText: string): MockFollowUpScenario | null =>
  scenarios.find((scenario) => scenario.question === botText) || null;
