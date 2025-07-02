import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App.tsx";
import "./index.css";
import ChatButton from "./components/ChatButton.tsx";
import ChatArea from "./components/ChatArea.tsx";

// ReactDOM.createRoot(document.getElementById("kzchatbot")!).render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <App />
//     </Provider>
//   </React.StrictMode>,
// );


const mountComponent = (id: string, Component: JSX.Element) => {
  ReactDOM.createRoot(document.getElementById(id)!).render(
    <React.StrictMode>
      <Provider store={store}>
        {Component}
      </Provider>
    </React.StrictMode>,
  );
}


mountComponent("kzchatbot", <App />);
mountComponent("chat-button", <ChatButton />);
mountComponent("chat-section", <ChatArea />)