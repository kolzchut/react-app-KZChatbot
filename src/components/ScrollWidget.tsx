import ArrowUpIcon from "@/assets/arrow-up.svg";

interface ScrollWidgetProps {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  showScrollWidget: boolean;
}

const ScrollWidget = ({
  scrollToBottom,
  showScrollWidget,
}: ScrollWidgetProps) => {
  return (
    <button
      className="fixed bottom-0 right-0"
      onClick={() => scrollToBottom()}
      hidden={!showScrollWidget}
      aria-label="גלול למטה"
    >
      <img src={ArrowUpIcon} alt="חץ למטה" className="transform rotate-180" />
    </button>
  );
};

export default ScrollWidget;
