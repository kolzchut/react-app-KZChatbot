declare const window: Window & { dataLayer: Record<string, unknown>[]; };

export const pushAnalyticsEvent = (eventAction: string, additionalData: Record<string, unknown> = {} ) => {
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
        event: "chatbot",
        event_action: eventAction,
		...additionalData
	});

};
