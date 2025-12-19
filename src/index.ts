export interface Env {
	DISCORD_WEBHOOK: string;
	ROOM_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Use POST', { status: 405 });
		}

		let data: any;
		try {
			data = await request.json();
		} catch {
			return new Response('Invalid JSON', { status: 400 });
		}

		// Validate room key
		if (!data.room_key || data.room_key !== env.ROOM_KEY) {
			return new Response('Forbidden', { status: 403 });
		}

		if (!data.url.startsWith('https://discord.com/api/webhooks/')) {
			return new Response('Invalid webhook', { status: 400 });
		}

		// Format message for Discord
		const isMessage = data.text && data.title && data.author;
		const message = `${data.user} highlighted: ${data.title} by ${data.author} - ${data.text}`;
		const payload = {
			content: isMessage ? message : 'no message',
			url: data.url,
		};

		// Forward to Discord webhook
		const discordResp = await fetch(env.DISCORD_WEBHOOK, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(payload),
		});

		if (!discordResp.ok) {
			return new Response('Failed to send to Discord', { status: 500 });
		}

		return new Response(data);
	},
};
