import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import Chatbot from "./components/chatbot/Chatbot.tsx";
import "./index.css";
import ChatButton from "./components/chatButton/ChatButton.tsx";
import ChatArea from "./components/chatArea/ChatArea.tsx";

// Load Open Sans font once at initialization
// Check if we've already loaded it or if it exists in the document
if (!document.getElementById('kzchatbot-font')) {
	// Check if any link tag already loads Open Sans
	const existingFontLink = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(
		link => link.getAttribute('href')?.includes('Open+Sans')
	);

	// Only add our font link if Open Sans isn't already being loaded
	if (!existingFontLink) {
		const link = document.createElement('link');
		link.id = 'kzchatbot-font';
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap';
		document.head.appendChild(link);
	}
}


const mountComponent = (id: string, Component: JSX.Element) => {
	let el = document.getElementById(id);
	if (!el) {
		if ( id === "kzchatbot" ) {
			el = document.createElement('div');
			el.id = id;
			el.className = id;
			document.body.appendChild(el);
		} else {
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
