import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import Chatbot from "./components/chatbot/Chatbot.tsx";
import "./index.css";
import ChatButton from "./components/chatButton/ChatButton.tsx";
import ChatArea from "./components/chatArea/ChatArea.tsx";
import { TranslationProvider } from "./contexts/TranslationContext.tsx";
import { loadOpenSansFont } from "./utils/loadFont.ts";
import { crossTabSyncService } from "./lib/crossTabSyncService.ts";

// Load Open Sans font only if not already available
loadOpenSansFont();

// Initialise cross-tab sync listener — pushes remote localStorage changes into Redux
crossTabSyncService.initializeService(store.dispatch);
window.addEventListener('beforeunload', () => crossTabSyncService.destroyService());

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
				<TranslationProvider>
					{Component}
				</TranslationProvider>
			</Provider>
		</React.StrictMode>,
	);
}

mountComponent("kzchatbot", <Chatbot />);
mountComponent("chat-button", <ChatButton />);
mountComponent("chat-section", <ChatArea />);
mountComponent("chat-section-home", <ChatArea isHomePage />);
