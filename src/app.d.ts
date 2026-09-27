declare global {
	interface Window {
		/** PostHog's snippet in app.html. On localhost it is never initialised, and has no capture. */
		posthog: { capture?(event: string, properties?: Record<string, unknown>): void };
	}
}

export {};
