import "./App.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Minimize2 } from "lucide-react";
import { useState } from "react";
import HelpIcon from "@/assets/help.svg";
import CloseIcon from "@/assets/close.svg";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <PopoverTrigger className="rounded-full bg-cta-background h-16 w-16 relative block">
        <div className={`flex flex-col items-center ${isOpen ? "hidden" : ""}`}>
          <img src={HelpIcon} alt="TODO: change-me" />
          <span className="text-xs font-bold leading-normal text-cta-foreground">
            כל שאלה
          </span>
        </div>
        <img
          src={CloseIcon}
          alt="TODO: change-me"
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 ${!isOpen ? "hidden" : ""}`}
        />
      </PopoverTrigger>
      <PopoverContent style={{ direction: "rtl" }}>
        <div className="bg-blue-200 flex justify-between px-4">
          <h2>כותרת</h2>
          <button>
            <Minimize2 onClick={() => setIsOpen(false)} />
          </button>
        </div>
        <div className="h-40"></div>
        <Input placeholder="מה רצית לשאול?" />
      </PopoverContent>
    </Popover>
  );
}

export default App;
