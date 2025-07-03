import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import Chatbot from "./components/chatbot/Chatbot.tsx";
import "./index.css";
import ChatButton from "./components/chatButton/ChatButton.tsx";
import ChatArea from "./components/chatArea/ChatArea.tsx";


const mountComponent = (id: string, Component: JSX.Element) => {
  ReactDOM.createRoot(document.getElementById(id)!).render(
    <React.StrictMode>
      <Provider store={store}>
        {Component}
      </Provider>
    </React.StrictMode>,
  );
}


mountComponent("kzchatbot", <Chatbot />);
mountComponent("chat-button", <ChatButton />);
mountComponent("chat-section", <ChatArea />)
