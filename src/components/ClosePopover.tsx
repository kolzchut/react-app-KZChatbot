import MinimizeIcon from "@/assets/minimize.svg";

interface ClosePopoverProps {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ClosePopover = ({ setIsOpen }: ClosePopoverProps) => {
  return (
    <div className="flex justify-end px-1 pt-1 mb-[3px]">
      <button onClick={() => setIsOpen(false)}>
        <img src={MinimizeIcon} alt="TODO: add alt" />
      </button>
    </div>
  );
};

export default ClosePopover;
