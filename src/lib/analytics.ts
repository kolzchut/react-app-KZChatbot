declare const window: Window & { dataLayer: Record<string, unknown>[]; };

export const pushAnalyticsEvent = (eventAction: string, eventLabel: string | null = null, source?: string) => {
    window.dataLayer = window.dataLayer || [];
    const eventData: Record<string, unknown> = {
        event: "chatbot_" + eventAction,
        event_action: eventAction,
        event_label: eventLabel
    };

    if (source) {
        eventData.source = source;
    }

    window.dataLayer.push(eventData);

};
