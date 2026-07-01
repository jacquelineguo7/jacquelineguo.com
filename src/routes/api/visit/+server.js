import { json } from '@sveltejs/kit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// GET /api/visit — increments the site-wide visit counter and reports the
// visitor's approximate location using Vercel's edge geolocation headers
// (only present on requests actually served by Vercel, not in local dev).
export async function GET({ request }) {
	const city = request.headers.get('x-vercel-ip-city');
	const region = request.headers.get('x-vercel-ip-country-region');
	const country = request.headers.get('x-vercel-ip-country');

	let count = null;
	const { KV_REST_API_URL, KV_REST_API_TOKEN } = env;

	if (KV_REST_API_URL && KV_REST_API_TOKEN) {
		const redis = new Redis({ url: KV_REST_API_URL, token: KV_REST_API_TOKEN });
		count = await redis.incr('visit_count');
	}

	return json({
		count,
		city: city ? decodeURIComponent(city) : null,
		region,
		country
	});
}