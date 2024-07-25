import "./App.css";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ChevronRight, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Popover open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <PopoverTrigger>
          <Button variant="rounded" size="largeIcon" className="relative">
            <ChevronRight
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 ${isOpen ? "animate-fade-out" : ""}`}
            />
            <X
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 ${!isOpen ? "animate-fade-out" : ""}`}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="bg-blue-200 flex justify-between px-4">
            <h2>כותרת</h2>
            <button>
              <Minimize2 className="h-6 w-6" onClick={() => setIsOpen(false)} />
            </button>
          </div>
          <div className="h-40"></div>
          <Input />
        </PopoverContent>
      </Popover>
    </>
  );
}

export default App;
