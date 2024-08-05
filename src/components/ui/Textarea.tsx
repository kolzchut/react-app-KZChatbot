import { FC, useState, useRef, ChangeEvent } from "react";

const Textarea: FC = () => {
  const [value, setValue] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.max(textareaRef.current.scrollHeight, 23) + "px";
    setValue(e.target.value);
  };

  return (
    <textarea
      className="block text-sm h-[23px] overflow-hidden w-full leading-[1.5] border-textArea-border placeholder:text-sm text-input placeholder:text-textArea-placholder bg-transparent border-b outline-none"
      ref={textareaRef}
      style={{
        resize: "none",
      }}
      value={value}
      onChange={handleChange}
      rows={1}
      placeholder="רוצה לפרט? זה יעזור לנו להשתפר"
    />
  );
};

export { Textarea };
