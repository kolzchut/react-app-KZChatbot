import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import Chatbot from "./components/chatbot/Chatbot.tsx";
import "./index.css";
import ChatButton from "./components/chatButton/ChatButton.tsx";
import ChatArea from "./components/chatArea/ChatArea.tsx";


const mountComponent = (id: string, Component: JSX.Element) => {
	let el = document.getElementById(id);
	if (!el) {
		if ( id === "kzchatbot" ) {
			el = document.createElement('div');
			el.id = id;
			el.className = id;
			document.body.appendChild(el);
		} else {
			// eslint-disable-next-line no-console
			console.debug(`[KZChatbot] Container element with id '#${id}' not found. Skipping mount.`);
			return;
		}
	}
	ReactDOM.createRoot(el).render(
		<React.StrictMode>
			<Provider store={store}>
				{Component}
			</Provider>
		</React.StrictMode>,
	);
}

mountComponent("kzchatbot", <Chatbot />);
mountComponent("chat-button", <ChatButton />);
mountComponent("chat-section", <ChatArea />);
mountComponent("chat-section-home", <ChatArea isHomePage />);
