import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Errors, Message, MessageType, Answer } from "@/types";
import { HttpError } from "../../lib/HttpError";
import { pushAnalyticsEvent } from "@/lib/analytics";
import { useMobile } from "@/lib/useMobile";
import { useTranslation } from "@/hooks/useTranslation";
import { FORMATTED_SLUGS } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openChat, closeChat, selectIsChatOpen } from "@/store/slices/chatSlice";
import { selectQuestion, selectQuestionSource, resetQuestion } from "@/store/slices/questionSlice";
import {
  Messages,
  Popover,
  PopoverContent,
  Footer,
  ClosePopover,
} from "@/components";
import WebiksFooter from "./webiksFooter/WebiksFooter";
import "./chatbot.css";


const Chatbot = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isChatOpen = useAppSelector(selectIsChatOpen);
  const question = useAppSelector(selectQuestion);
  const questionSource = useAppSelector(selectQuestionSource);

  const [globalConfigObject, setGlobalConfigObject] = useState<
    typeof window.KZChatbotConfig | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const initialErrors: Errors = useMemo(() => ({
    description: "",
  }), []);
  const [errors, setErrors] = useState<Errors>(initialErrors);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasAskedQuestions, setHasAskedQuestions] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobile();

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

    useEffect(() => {
    if (globalConfigObject?.autoOpen) {
      pushAnalyticsEvent("opened", "auto-opened");
      dispatch(openChat());
    }
  }, [globalConfigObject, dispatch]);

  const handleCloseChat = () => {
    if (!hasAskedQuestions) {
      pushAnalyticsEvent("closed_unused");
    }
    dispatch(closeChat());
    setHasAskedQuestions(false); // Reset for next session
  };

  const getAnswer = useCallback(async (question: string): Promise<Answer | void> => {
    const isProduction = import.meta.env.MODE === "production";

    const url = isProduction
      ? `${globalConfigObject?.restPath}/kzchatbot/v0/question`
      : "/api/kzchatbot/v0/question";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: question,
        uuid: globalConfigObject?.uuid || "",
        referrer: globalConfigObject?.referrer || ""
      }),
    });


    // A non-JSON body is itself a failure mode: a 502 from the edge, or an
    // HTML error page, would otherwise throw here and be reported as a network
    // error rather than the HTTP status it actually was.
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const serverMessage =
        typeof data?.message === "string" ? data.message : "";

      // Only 4xx messages are ours. The endpoint throws HttpException with an
      // operator-authored slug for every deliberate rejection (403 banned word,
      // 413 character limit, 429 daily limit, 404 unknown user), and those are
      // written to be read by the person in the chat window.
      //
      // A 5xx message is not ours. MediaWiki's REST layer turns an uncaught
      // Throwable into `Error: exception of type <Class>` (its wording when
      // $wgShowExceptionDetails is off), and rendering that verbatim is how a
      // PHP bug reached readers as an English class name for 13 hours on
      // 2026-08-10. The server now guards its own handler, but faults thrown
      // outside it — the 415 from getBodyValidator(), a body the Router
      // rejects, anything the edge generates — never pass through that guard.
      // So the client refuses 5xx text on its own account.
      const trusted = response.status < 500 && serverMessage !== "";

      pushAnalyticsEvent(
        "error_received",
        response.status + ": " + (serverMessage || "(no message)"),
      );
      throw new HttpError(trusted ? serverMessage : "", response.status);
    }
    return data;
  }, [globalConfigObject]);

  const submitQuestion = useCallback(async () => {
    if (question === "" || !question.trim()) {
      return false;
    }

    setIsLoading(true);
    let isFirstQuestion = true;

    if (
      !question ||
      !globalConfigObject ||
      !globalConfigObject?.uuid ||
      globalConfigObject.chatbotIsShown !== true ||
      !globalConfigObject.slugs
    ) {
      return null;
    }

    try {
      pushAnalyticsEvent("question_asked", questionSource || "popup");
      setHasAskedQuestions(true);
      setMessages((prevMessages) => {
        prevMessages.map((item) => {
          if (item.type !== MessageType.StartBot) {
            isFirstQuestion = false;
          }
        });

        const newMessages: Message[] = [
          ...prevMessages,
          {
            id: uuidv4(),
            content: question,
            type: MessageType.User,
            isFirstQuestion,
          },
        ];

        return newMessages;
      });

      const answer = await getAnswer(question);
      if (!answer?.llmResult) throw new Error();

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: answer.conversationId,
          content: answer.llmResult,
          type: MessageType.Bot,
          links: answer.docs,
        },
      ]);
      setShowInput(false);
      pushAnalyticsEvent("answer_received");
    } catch (error) {
      let content: string;
      let type: MessageType;
      if (error instanceof HttpError) {
        // Empty means getAnswer judged the server's text untrusted (5xx, or no
        // usable message). Never render a bare bubble — fall back to the slug.
        content = error.message || t('general_error');
        type = error.httpCode === 403 ? MessageType.Warning : MessageType.Error;
      } else {
        content = t('general_error');
        type = MessageType.Error;
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: uuidv4(),
          content,
          type,
        },
      ]);
      console.error(error);
    } finally {
      dispatch(resetQuestion());
      setIsLoading(false);
      setErrors(initialErrors);
    }
  }, [question, globalConfigObject, questionSource, dispatch, initialErrors, getAnswer]);

  // Handle all question submissions from Redux (embed widget and chat input)
  useEffect(() => {
    if (question && question.trim()) {
      submitQuestion();
    }
  }, [question, submitQuestion]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior,
      });
    }
  }, []);

  const scrollToAnswer = useCallback(() => {
    if (messageContainerRef.current) {
      const lastMessage = messageContainerRef.current.lastElementChild;
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);


  useEffect(() => {
    if (
      errors.description ||
      (messages.length &&
        messages[messages.length - 1].type === MessageType.User)
    ) {
      scrollToBottom("instant");
    }
  }, [scrollToBottom, errors, messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      messages.length &&
      lastMessage.liked === undefined &&
      [MessageType.Bot, MessageType.Warning, MessageType.Error].includes(
        lastMessage.type,
      )
    ) {
      scrollToAnswer();
    }
  }, [messages, scrollToAnswer]);

  useEffect(() => {
    if (window.KZChatbotConfig) {
      const initMessages =
        window.KZChatbotConfig.questionsPermitted > 0
          ? [
            {
              id: uuidv4(),
              content: t('welcome_message'),
              type: MessageType.StartBot,
              formattedContent: FORMATTED_SLUGS.has('welcome_message'),
            },
          ]
          : [
            {
              id: uuidv4(),
              content:
                t('questions_daily_limit'),
              type: MessageType.StartBot,
            },
          ];
      setMessages(initMessages);
      setGlobalConfigObject(window.KZChatbotConfig);
    }
  }, [setMessages, globalConfigObject]);


  return (
    <Popover isChatOpen={isChatOpen}>
      <div className="chatbot-overlay" />
      <PopoverContent className={`chatbot-popover-content ${isMobile ? "mobile" : "desktop"}`}>
        <ClosePopover
          handleChatSetIsOpen={handleCloseChat}
        />
        <div className="chatbot-popover-main">
          <Messages
            setMessages={setMessages}
            messages={messages}
            isLoading={isLoading}
            ref={messageContainerRef}
            globalConfigObject={globalConfigObject}
            errors={errors}
            setErrors={setErrors}
            initialErrors={initialErrors}
          />
          <Footer
            isLoading={isLoading}
            showInput={showInput}
            setShowInput={setShowInput}
            globalConfigObject={globalConfigObject}
            errors={errors}
            setErrors={setErrors}
            messages={messages}
            isChatOpen={isChatOpen}
          />
          <WebiksFooter />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Chatbot;
