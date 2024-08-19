import XButton from "@/assets/x.svg";
import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useForm, SubmitHandler, UseFormRegisterReturn } from "react-hook-form";
import { Message } from "@/types";

enum ReasonValue {
  NOT_TRUE = "NOT_TRUE",
  IRRELEVANT = "IRRELEVANT",
  UNCLEAR = "UNCLEAR",
}

type FormFields = {
  reason: ReasonValue;
  description: string;
};

interface Reason {
  value: ReasonValue;
  label: string;
}

interface RatingProps {
  message: Message;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
}

const Rating = ({ message, setMessages, globalConfigObject }: RatingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<FormFields>({
    mode: "onChange",
  });

  const slugs = globalConfigObject?.slugs;
  const description = register("description", {
    maxLength: {
      value: globalConfigObject?.feedbackCharacterLimit || 150,
      message: slugs?.feedback_character_limit || "",
    },
  });
  const descriptionValue = watch("description");
  const reasonValue = watch("reason");
  const ref = useRef<HTMLDivElement>(null);
  const isFormValid = isValid && (descriptionValue?.length > 0 || reasonValue);

  const reasons: Reason[] = [
    {
      value: ReasonValue.NOT_TRUE,
      label: slugs?.dislike_followup_q_first || "not true",
    },
    {
      value: ReasonValue.IRRELEVANT,
      label: slugs?.dislike_followup_q_second || "not relevant",
    },
    {
      value: ReasonValue.UNCLEAR,
      label: slugs?.dislike_followup_q_third || "unclear",
    },
  ];

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    const isProduction = import.meta.env.MODE === "production";
    const url = isProduction
      ? `${globalConfigObject?.restPath}/kzchatbot/v0/rate`
      : "/api/kzchatbot/v0/rate";
    const { reason, description } = data;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answerId: message.id,
          answerClassification: reason,
          text: description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.messageTranslations.he); // TODO: add type for data
      }

      setIsFormSubmitted(true);
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTextChange = (
    e: ChangeEvent<HTMLTextAreaElement>,
    description: UseFormRegisterReturn<"description">,
  ) => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.max(textareaRef.current.scrollHeight, 23) + "px";
    setValue("description", e.target.value);
    description.onChange(e);
  };

  const handleRating = async (liked: boolean | null) => {
    const isProduction = import.meta.env.MODE === "production";
    const url = isProduction
      ? `${globalConfigObject?.restPath}/kzchatbot/v0/rate`
      : "/api/kzchatbot/v0/rate";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          like: liked,
          answerId: message.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.messageTranslations.he); // TODO: add type for data
      }

      setMessages((prevMessages) =>
        prevMessages.map((prevMessage) =>
          prevMessage.id === message.id
            ? {
                ...prevMessage,
                liked: prevMessage.liked === liked ? null : liked,
              }
            : prevMessage,
        ),
      );
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseRating = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (isFormSubmitted) return;

    if (message.liked === null || message.liked === undefined) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [message, isFormSubmitted]);

  useEffect(() => {
    if (isOpen) {
      ref.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  return (
    <div ref={ref}>
      <style>
        {`
        button[aria-pressed='true'] {
          path {
            fill: var(--kzcb-popover);
          }
          &::before {
          display: inline-flex;
            content: '';
            position: absolute;
            background: var(--kzcb-input-background);
            width: 1.5rem;
            height: 1.5rem;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
          }
        }
      `}
      </style>
      <div className="flex items-center">
        <span className="text-message-user-background text-xs ml-1">
          {slugs?.ranking_request}
        </span>
        <button
          disabled={isFormSubmitted}
          aria-label="סמנ/י שהתשובה עזרה לי"
          aria-pressed={message.liked === true}
          className="px-[6px] relative pointer-events-auto"
          onClick={() => handleRating(message.liked === true ? null : true)}
        >
          <svg
            width="16"
            height="19"
            viewBox="0 0 16 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="true"
            className="relative pointer-events-none"
          >
            <title>אייקון של אגודל למעלה</title>
            <desc>אייקון של אגודל מורמת מעלה שמצביע על כך שהתשובה עזרה לי</desc>
            <path
              d="M11.8028 17.9698C11.8021 17.9698 10.3905 17.9681 9.93535 17.9681C7.58706 17.9681 5.90433 17.7653 4.63993 17.33C4.37057 17.2361 4.13517 17.1318 3.92754 17.0399C3.55994 16.8772 3.26978 16.7487 2.96874 16.7487H1.74219C1.37083 16.7487 0.833046 16.7092 0.453498 16.3678C0.0469737 16.0022 0 15.472 0 15.1051L0.000268404 9.53236C0.000268404 9.02073 0.158369 8.58872 0.457658 8.28315C0.672664 8.06334 1.0702 7.80139 1.74219 7.80139C1.77507 7.80139 1.81144 7.80179 1.8509 7.80219C2.23421 7.80646 2.86486 7.81313 3.27286 7.46115C3.29769 7.4138 3.32185 7.36938 3.34359 7.3295C3.35822 7.30056 3.37204 7.27682 3.38238 7.25881C3.386 7.25268 3.38976 7.24654 3.39325 7.23974C3.42143 7.17319 3.45485 7.11423 3.49431 7.06195C3.71173 6.70036 3.9564 6.36319 4.16912 6.13258C4.63899 5.62174 5.07451 5.35752 5.45875 5.12425C5.90983 4.85042 6.23583 4.65263 6.51955 4.10205L6.53942 4.06377C6.96419 3.2407 7.14001 2.90005 7.2463 2.49138C7.28227 2.3528 7.29811 2.20716 7.29328 2.05857C7.25476 1.48185 7.54157 0.596629 8.49473 0.490994L8.52318 0.487793H8.55177C9.13196 0.487793 9.61767 0.624371 9.99561 0.893526C10.5581 1.29419 10.8433 1.9452 10.8433 2.82829C10.8433 4.40348 10.4557 5.66376 10.1212 6.45788L14.1018 6.95458C15.0554 7.00927 15.7919 7.86755 15.7481 8.87948C15.7249 9.41606 15.5011 9.89981 15.1603 10.2377C15.4824 10.5519 15.6537 10.9768 15.6349 11.4658C15.6287 11.9558 15.4774 12.3474 15.1853 12.6298C15.0724 12.7389 14.9461 12.8234 14.8126 12.8888C15.0386 13.1857 15.1606 13.5471 15.1606 13.9298C15.1606 14.4517 14.9618 14.928 14.6008 15.2708C14.3066 15.5501 13.9218 15.7251 13.5139 15.7708C13.5774 15.9454 13.6068 16.1353 13.5989 16.3353C13.5981 16.4149 13.5904 16.5619 13.5789 16.6316C13.5263 16.9469 13.3985 17.1967 13.1881 17.3956C12.7909 17.7712 12.3118 17.9698 11.8028 17.9698ZM1.74219 8.82573C1.2436 8.82573 1.03101 9.037 1.03101 9.53249L1.03074 15.1053C1.03074 15.2878 1.0506 15.5234 1.14509 15.6085C1.19327 15.6517 1.33499 15.7244 1.74219 15.7244H2.96874C3.48894 15.7244 3.90567 15.909 4.34695 16.1042C4.54585 16.1924 4.75146 16.2834 4.97922 16.3629C6.11424 16.7535 7.7359 16.9439 9.93535 16.9439C10.3907 16.9439 11.8034 16.9456 11.8034 16.9456C12.0457 16.9456 12.2728 16.8473 12.4778 16.6535C12.5039 16.6288 12.5392 16.5955 12.5608 16.4716C12.5637 16.4412 12.5676 16.3639 12.5683 16.3323L12.5678 16.3213L12.5688 16.2975C12.5778 16.0981 12.4789 15.9515 12.2749 15.8615C12.0339 15.7552 11.8889 15.5086 11.9142 15.2476C11.946 14.9177 12.2426 14.672 12.5749 14.6998L13.2678 14.7581C13.5013 14.7663 13.7273 14.6835 13.8888 14.5303C14.0465 14.3805 14.13 14.1728 14.13 13.9298C14.13 13.6009 13.8885 13.2284 13.3585 13.1874C13.2078 13.176 13.0662 13.1027 12.9703 12.9866C12.8743 12.8708 12.8296 12.7189 12.8473 12.5699C12.8813 12.2857 13.1249 12.0749 13.4121 12.0812C13.7285 12.0871 14.2581 12.0972 14.4667 11.8955C14.5001 11.8634 14.6015 11.7654 14.6043 11.4482L14.6047 11.4309C14.6241 10.9786 14.2618 10.8021 13.9543 10.7334C13.699 10.6763 13.5232 10.438 13.5455 10.1791C13.5679 9.92022 13.7817 9.71522 14.043 9.70228C14.3953 9.68454 14.6985 9.29562 14.7185 8.83546C14.7382 8.37945 14.431 7.99426 14.0337 7.97692L13.9921 7.97332L9.93857 7.46755C9.62774 7.42874 9.35999 7.25175 9.20403 6.98192C9.04795 6.7121 9.02889 6.39306 9.15169 6.1067C9.39851 5.53118 9.81255 4.34012 9.81255 2.82843C9.81255 1.68312 9.1631 1.518 8.58398 1.5124C8.47044 1.53027 8.41273 1.58082 8.36884 1.69699C8.32455 1.81423 8.31985 1.94987 8.322 1.99615L8.32308 2.00843L8.32281 2.01283C8.3322 2.26331 8.30576 2.51059 8.24403 2.74773C8.10914 3.26644 7.90461 3.66283 7.45648 4.53125L7.43675 4.5694C7.02083 5.37646 6.49969 5.6927 5.99586 5.99853C5.6543 6.20594 5.30092 6.42027 4.92942 6.82427C4.75884 7.00913 4.54706 7.30456 4.36265 7.61493L4.33031 7.66615C4.30977 7.71083 4.29004 7.74484 4.27636 7.76858C4.2726 7.77525 4.26844 7.78179 4.26481 7.78899L4.25381 7.81046C4.22254 7.86741 4.18603 7.9349 4.1514 8.00359L4.11396 8.07748L4.05504 8.13604C3.34399 8.84267 2.32788 8.83173 1.83963 8.82653C1.80433 8.826 1.77172 8.82573 1.74219 8.82573ZM12.5851 16.4813C12.5845 16.4846 12.5839 16.4883 12.5833 16.492C12.5836 16.4901 12.5839 16.488 12.5845 16.4862L12.5851 16.4813ZM12.5909 16.361C12.5909 16.364 12.5912 16.3668 12.5912 16.3692L12.5909 16.361Z"
              fill="#D4DDE6"
            />
          </svg>
        </button>
        <button
          disabled={isFormSubmitted}
          aria-label="סמנ/י שהתשובה לא עזרה לי"
          aria-pressed={message.liked === false}
          className="px-[6px] relative pointer-events-auto"
          onClick={() => handleRating(message.liked === false ? null : false)}
        >
          <svg
            width="16"
            height="18"
            viewBox="0 0 16 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-hidden="true"
            className="relative pointer-events-none"
          >
            <title>אייקון של אגודל למטה</title>
            <desc>
              אייקון של אגודל מורדת מטה שמצביע על כך שהתשובה לא עזרה לי
            </desc>
            <path
              d="M11.8028 0.517998C11.8021 0.517998 10.3905 0.519733 9.93535 0.519733C7.58706 0.519733 5.90433 0.722466 4.63993 1.15781C4.37057 1.25171 4.13517 1.35601 3.92754 1.4479C3.55994 1.61062 3.26978 1.73907 2.96874 1.73907H1.74219C1.37083 1.73907 0.833046 1.77855 0.453498 2.11999C0.0469737 2.48558 0 3.01575 0 3.38267L0.000268404 8.95543C0.000268404 9.46707 0.158369 9.89908 0.457658 10.2046C0.672664 10.4244 1.0702 10.6864 1.74219 10.6864C1.77507 10.6864 1.81144 10.686 1.8509 10.6856C2.23421 10.6813 2.86486 10.6747 3.27286 11.0266C3.29769 11.074 3.32185 11.1184 3.34359 11.1583C3.35822 11.1872 3.37204 11.211 3.38238 11.229C3.386 11.2351 3.38976 11.2412 3.39325 11.2481C3.42143 11.3146 3.45485 11.3736 3.49431 11.4258C3.71173 11.7874 3.9564 12.1246 4.16912 12.3552C4.63899 12.866 5.07451 13.1303 5.45875 13.3635C5.90983 13.6374 6.23583 13.8352 6.51955 14.3857L6.53942 14.424C6.96419 15.2471 7.14001 15.5877 7.2463 15.9964C7.28227 16.135 7.29811 16.2806 7.29328 16.4292C7.25476 17.0059 7.54157 17.8912 8.49473 17.9968L8.52318 18H8.55177C9.13196 18 9.61767 17.8634 9.99561 17.5943C10.5581 17.1936 10.8433 16.5426 10.8433 15.6595C10.8433 14.0843 10.4557 12.824 10.1212 12.0299L14.1018 11.5332C15.0554 11.4785 15.7919 10.6202 15.7481 9.60831C15.7249 9.07174 15.5011 8.58798 15.1603 8.25013C15.4824 7.9359 15.6537 7.51096 15.6349 7.022C15.6287 6.53197 15.4774 6.14038 15.1853 5.85802C15.0724 5.74891 14.9461 5.66435 14.8126 5.599C15.0386 5.3021 15.1606 4.94065 15.1606 4.55799C15.1606 4.03609 14.9618 3.5598 14.6008 3.21702C14.3066 2.93773 13.9218 2.76274 13.5139 2.71699C13.5774 2.5424 13.6068 2.35247 13.5989 2.15253C13.5981 2.07291 13.5904 1.92593 13.5789 1.85617C13.5263 1.54087 13.3985 1.29105 13.1881 1.09219C12.7909 0.716597 12.3118 0.517998 11.8028 0.517998ZM1.74219 9.66206C1.2436 9.66206 1.03101 9.4508 1.03101 8.9553L1.03074 3.38254C1.03074 3.19995 1.0506 2.9644 1.14509 2.87931C1.19327 2.83609 1.33499 2.7634 1.74219 2.7634H2.96874C3.48894 2.7634 3.90567 2.57881 4.34695 2.38354C4.54585 2.29538 4.75146 2.20442 4.97922 2.12492C6.11424 1.73426 7.7359 1.54393 9.93535 1.54393C10.3907 1.54393 11.8034 1.5422 11.8034 1.5422C12.0457 1.5422 12.2728 1.6405 12.4778 1.8343C12.5039 1.85897 12.5392 1.89231 12.5608 2.01622C12.5637 2.04663 12.5676 2.12386 12.5683 2.15547L12.5678 2.16654L12.5688 2.19028C12.5778 2.38968 12.4789 2.53626 12.2749 2.62629C12.0339 2.73259 11.8889 2.97921 11.9142 3.24023C11.946 3.57007 12.2426 3.81575 12.5749 3.788L13.2678 3.72972C13.5013 3.72145 13.7273 3.80428 13.8888 3.95753C14.0465 4.10731 14.13 4.31498 14.13 4.55799C14.13 4.8869 13.8885 5.25942 13.3585 5.30037C13.2078 5.31184 13.0662 5.38506 12.9703 5.50123C12.8743 5.617 12.8296 5.76892 12.8473 5.9179C12.8813 6.20213 13.1249 6.41287 13.4121 6.4066C13.7285 6.40073 14.2581 6.39059 14.4667 6.59226C14.5001 6.6244 14.6015 6.72243 14.6043 7.03961L14.6047 7.05694C14.6241 7.50922 14.2618 7.68568 13.9543 7.75437C13.699 7.81146 13.5232 8.0498 13.5455 8.30869C13.5679 8.56757 13.7817 8.77257 14.043 8.78551C14.3953 8.80325 14.6985 9.19218 14.7185 9.65233C14.7382 10.1083 14.431 10.4935 14.0337 10.5109L13.9921 10.5145L9.93857 11.0202C9.62774 11.0591 9.35999 11.236 9.20403 11.5059C9.04795 11.7757 9.02889 12.0947 9.15169 12.3811C9.39851 12.9566 9.81255 14.1477 9.81255 15.6594C9.81255 16.8047 9.1631 16.9698 8.58398 16.9754C8.47044 16.9575 8.41273 16.907 8.36884 16.7908C8.32455 16.6736 8.31985 16.5379 8.322 16.4916L8.32308 16.4794L8.32281 16.475C8.3322 16.2245 8.30576 15.9772 8.24403 15.7401C8.10914 15.2214 7.90461 14.825 7.45648 13.9565L7.43675 13.9184C7.02083 13.1113 6.49969 12.7951 5.99586 12.4893C5.6543 12.2819 5.30092 12.0675 4.92942 11.6635C4.75884 11.4787 4.54706 11.1832 4.36265 10.8729L4.33031 10.8216C4.30977 10.777 4.29004 10.743 4.27636 10.7192C4.2726 10.7125 4.26844 10.706 4.26481 10.6988L4.25381 10.6773C4.22254 10.6204 4.18603 10.5529 4.1514 10.4842L4.11396 10.4103L4.05504 10.3518C3.34399 9.64513 2.32788 9.65606 1.83963 9.66126C1.80433 9.6618 1.77172 9.66206 1.74219 9.66206ZM12.5851 2.00652C12.5845 2.00315 12.5839 1.99949 12.5833 1.99582C12.5836 1.99765 12.5839 1.99979 12.5845 2.00163L12.5851 2.00652ZM12.5909 2.1268C12.5909 2.12374 12.5912 2.12099 12.5912 2.11855L12.5909 2.1268Z"
              fill="#D4DDE6"
            />
          </svg>
        </button>
      </div>
      {isOpen && (
        <form
          className="mt-2 p-2 border border-line"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-input">
              {slugs?.dislike_follow_up_question}
            </span>
            <button onClick={handleCloseRating}>
              <img src={XButton} alt="x icon" />
            </button>
          </div>
          {!message.liked && (
            <div className="flex mt-2 -mx-1">
              {reasons &&
                reasons.map((reason, index) => (
                  <label key={index} className="px-1">
                    <input
                      type="radio"
                      value={reason.value}
                      className="sr-only peer"
                      {...register(`reason`)}
                    />
                    <div className="px-4 h-[30px] flex items-center text-xs text-input rounded-full border border-message-user-background peer-checked:bg-input peer-checked:text-input-placholder peer-focus-visible:outline-1 peer-focus-visible:outline">
                      {reason.label}
                    </div>
                  </label>
                ))}
            </div>
          )}
          <div className="mb-1 mt-3">
            <textarea
              name="description"
              className="block text-sm h-[23px] overflow-hidden w-full leading-[1.5] border-textArea-border placeholder:text-sm text-input placeholder:text-textArea-placholder bg-transparent border-b outline-none"
              style={{
                resize: "none",
              }}
              ref={textareaRef}
              onBlur={description.onBlur}
              onChange={(e) => handleTextChange(e, description)}
              rows={1}
              placeholder={slugs?.feedback_free_text}
            />
            {errors.description && (
              <p
                className="text-sm text-destructive bg-destructive inline-block px-1 mt-1"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-disclaimer">
              {slugs?.feedback_free_text_disclaimer}
            </span>
            <input
              disabled={!isFormValid}
              type="submit"
              value="שליחה"
              className="disabled:opacity-45 disabled:cursor-not-allowed rounded-full h-[29px] text-xs font-bold px-3 cursor-pointer bg-button text-button-foreground"
            />
          </div>
        </form>
      )}
    </div>
  );
};

export default Rating;
