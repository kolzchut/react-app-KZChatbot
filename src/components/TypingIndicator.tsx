import { FC } from "react";

const TypingIndicator: FC = () => {
  return (
    <div className="flex float-end mb-2">
      <div className="border border-message-user-background px-[10px] py-5 rounded-[10px_10px_10px_0]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="6"
          viewBox="0 0 20 6"
          fill="none"
        >
          <ellipse
            className="dot"
            cx="2.59259"
            cy="2.85185"
            rx="2.59259"
            ry="2.85185"
            fill="white"
          />
          <ellipse
            className="dot"
            cx="10.0001"
            cy="2.85185"
            rx="2.59259"
            ry="2.85185"
            fill="white"
          />
          <ellipse
            className="dot"
            cx="17.4074"
            cy="2.85185"
            rx="2.59259"
            ry="2.85185"
            fill="white"
          />
          <style>{`
        .dot {
          animation: blink 1.4s infinite both;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0% {
            opacity: 0.2;
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }
      `}</style>
        </svg>
      </div>
    </div>
  );
};

export default TypingIndicator;
