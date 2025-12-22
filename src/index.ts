const DISCORD_API = 'https://discord.com/api/v10';

export interface Env {
	BOT_TOKEN: string;
	TOKENS: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method !== 'POST') {
			return new Response('Use POST', { status: 405 });
		}

		let data: any;
		try {
			data = await request.json();
		} catch {
			return new Response('Invalid JSON', { status: 400 });
		}

		// -----------------------------
		// /register endpoint
		// -----------------------------
		if (url.pathname === '/register') {
			const { token, guildID, channelID, userID } = data;

			if (!token || !guildID || !channelID || !userID) {
				return new Response('Missing required fields', { status: 400 });
			}

			// Store the mapping in KV
			await env.TOKENS.put(token, JSON.stringify({ guildID, channelID, userID }));

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// -----------------------------
		// /quote endpoint
		// -----------------------------
		if (url.pathname === '/quote') {
			const { token, text, title, author, user } = data;

			if (!token) {
				return new Response('Missing token', { status: 400 });
			}

			// Lookup the mapping from KV
			const record = await env.TOKENS.get(token, { type: 'json' });
			if (!record || !record.channelID) {
				return new Response('Invalid or expired token', { status: 403 });
			}

			// Format Discord message
			const isMessage = text && title && author && user;
			const message = isMessage ? `\`\`\`\n${user} highlighted:\n\n${title}\nby ${author}\n\n${text}\n\`\`\`` : 'No message';

			// Post to Discord
			const discordResp = await fetch(`${DISCORD_API}/channels/${record.channelID}/messages`, {
				method: 'POST',
				headers: {
					Authorization: `Bot ${env.BOT_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ content: message }),
			});

			if (!discordResp.ok) {
				const err = await discordResp.text();
				return new Response(`Discord API error: ${err}`, { status: 500 });
			}

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		return new Response('Unknown endpoint', { status: 404 });
	},
};
