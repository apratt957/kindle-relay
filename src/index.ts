export interface Env {
	DISCORD_WEBHOOK: string;
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

		// Format message for Discord
		const isMessage = data.text && data.title && data.author;
		const message = '```' + `${data.user} highlighted:\n\n${data.title}\nby ${data.author}\n\n` + data.text + '```';
		const payload = {
			content: isMessage ? message : 'no message',
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
