import PaperPlaneIcon from "@/assets/paper-plane.svg";
import { Input } from "@/components";

interface FooterProps {
  isLoading: boolean;
  showInput: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>;
}

const Footer = ({
  isLoading,
  showInput,
  handleSubmit,
  setShowInput,
}: FooterProps) => {
  if (isLoading) {
    return null;
  }

  return (
    <div className="px-3">
      {showInput ? (
        <>
          <div className="flex justify-end items-center text-links-foreground text-sm mb-2">
            <a href="TODO: add link" target="_blank">
              תנאי שימוש
            </a>
            <span className="px-2 "> | </span>
            <a href="TODO: add link" target="_blank">
              איך לדבר עם הבוט?
            </a>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center flex-col pb-2"
          >
            <Input
              type="text"
              name="question"
              placeholder="מה רצית לשאול?"
              submitElement={<img src={PaperPlaneIcon} alt="TODO: change-me" />}
            />
            <span className="text-xs text-disclaimer">
              אין לשתף פרטים מזהים או מידע רגיש
            </span>
          </form>
        </>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="relative block mx-auto my-0 mb-6 bg-button text-button-foreground text-xs font-bold h-[29px] rounded-full px-5 before:absolute before:bg-line before:w-[200px] before:h-[1px] before:right-0 before:top-1/2 before:translate-x-full before:-translate-y-1/2 before:pointer-events-none
       after:absolute after:bg-line after:w-[200px] after:h-[1px] after:left-0 after:top-1/2 after:-translate-x-full after:-translate-y-1/2 after:pointer-events-none"
        >
          שאלה חדשה
        </button>
      )}
    </div>
  );
};

export default Footer;
