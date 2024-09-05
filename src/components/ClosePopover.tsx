import MinimizeIcon from "@/assets/minimize.svg";

interface ClosePopoverProps {
  chatSetIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ClosePopover = ({ chatSetIsOpen }: ClosePopoverProps) => {
  return (
    <div className="flex justify-end px-1 pt-1 mb-[3px]">
      <button onClick={() => chatSetIsOpen(false)}>
        <img src={MinimizeIcon} alt="TODO: add alt" />
      </button>
    </div>
  );
};

export default ClosePopover;
