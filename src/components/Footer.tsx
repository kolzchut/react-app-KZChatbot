import PaperPlaneIcon from "@/assets/paper-plane.svg";
import { Input } from "@/components";
import { Errors } from "@/types";

interface FooterProps {
  isLoading: boolean;
  showInput: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  errors: Errors;
  setErrors: React.Dispatch<React.SetStateAction<Errors>>;
}

const Footer = ({
  isLoading,
  showInput,
  handleSubmit,
  setShowInput,
  globalConfigObject,
  question,
  setQuestion,
  errors,
  setErrors,
}: FooterProps) => {
  if (isLoading) {
    return null;
  }
  const slugs = window.KZChatbotConfig.slugs;
  const handleOnMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);

    const charLimitSlug =
      globalConfigObject?.slugs.feedback_character_limit || "";
    const reachedCharLimit =
      e.target.value.length >=
      (globalConfigObject?.questionCharacterLimit || 150);

    setErrors((prevErrors) => ({
      ...prevErrors,
      question: reachedCharLimit ? charLimitSlug : "",
    }));
  };

  return (
    <div className="px-4">
      {showInput ? (
        <>
          <div className="flex justify-end items-center text-links-foreground text-sm mb-2">
            {globalConfigObject?.termsofServiceUrl && (
              <>
                <a href={globalConfigObject.termsofServiceUrl} target="_blank">
                  {slugs?.tc_link}
                </a>
                <span className="px-2 "> | </span>
              </>
            )}
            {globalConfigObject?.usageHelpUrl && (
              <a href={globalConfigObject.usageHelpUrl} target="_blank">
                {slugs?.chat_tip_link}
              </a>
            )}
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center flex-col pb-2"
          >
            <Input
              type="text"
              name="question"
              value={question}
              onChange={handleOnMessageChange}
              placeholder={slugs?.question_field}
              submitElement={
                <img
                  src={PaperPlaneIcon}
                  className="block"
                  alt="TODO: change-me"
                />
              }
              maxLength={globalConfigObject?.questionCharacterLimit || 150}
              errors={errors}
            />
            <span className="text-xs text-disclaimer">
              {slugs?.question_disclaimer}
            </span>
          </form>
        </>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="relative block mx-auto my-0 mb-6 bg-button text-button-foreground text-xs font-bold h-[29px] rounded-full px-5 before:absolute before:bg-line before:w-[200px] before:h-[1px] before:right-0 before:top-1/2 before:translate-x-full before:-translate-y-1/2 before:pointer-events-none
       after:absolute after:bg-line after:w-[200px] after:h-[1px] after:left-0 after:top-1/2 after:-translate-x-full after:-translate-y-1/2 after:pointer-events-none"
        >
          {slugs?.new_question_button}
        </button>
      )}
    </div>
  );
};

export default Footer;
