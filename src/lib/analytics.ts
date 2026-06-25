declare const window: Window & { dataLayer: Record<string, unknown>[]; };

export const pushAnalyticsEvent = (
    eventAction: string,
    eventLabel: string | null = null,
    payload: Record<string, unknown> = {},
) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: "chatbot_" + eventAction,
        event_action: eventAction,
        event_label: eventLabel,
        ...payload,
    });
};
