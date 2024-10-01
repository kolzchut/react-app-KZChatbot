import MinimizeIcon from "@/assets/minimize.svg";

interface ClosePopoverProps {
  chatSetIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  globalConfigObject: typeof window.KZChatbotConfig | null;
}

const ClosePopover = ({ chatSetIsOpen, globalConfigObject }: ClosePopoverProps) => {
	const slugs = globalConfigObject?.slugs;

	return (
    <div className="flex justify-end px-1 pt-1 mb-[3px]">
      <button onClick={() => chatSetIsOpen(false)} aria-label={slugs?.close_chat_icon} title={slugs?.close_chat_icon}>
        <img src={MinimizeIcon} alt="" />
      </button>
    </div>
  );
};

export default ClosePopover;
