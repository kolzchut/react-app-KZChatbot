import MinimizeIcon from "@/assets/minimize.svg";

interface ClosePopoverProps {
  globalConfigObject: typeof window.KZChatbotConfig | null;
  handleChatSetIsOpen: (isOpen: boolean) => void;
}

const ClosePopover = ({ globalConfigObject, handleChatSetIsOpen }: ClosePopoverProps) => {
	const slugs = globalConfigObject?.slugs;

	return (
    <div className="flex justify-end px-1 pt-1 mb-[3px]">
      <button onClick={() => handleChatSetIsOpen(false)} aria-label={slugs?.close_chat_icon} title={slugs?.close_chat_icon}>
        <img src={MinimizeIcon} alt="" />
      </button>
    </div>
  );
};

export default ClosePopover;
