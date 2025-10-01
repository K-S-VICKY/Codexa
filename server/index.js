const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());

// ENV VARS
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SERVER_BASE = process.env.SERVER_BASE || 'http://localhost:3004';
const CALLBACK_PATH = '/auth/spotify/callback';
const CALLBACK_URL = `${SERVER_BASE}${CALLBACK_PATH}`;
const DEFAULT_SCOPES = ['user-read-email', 'playlist-read-private', 'user-library-read'];

function encodeState(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
function decodeState(s) { try { return JSON.parse(Buffer.from(s, 'base64url').toString('utf8')); } catch { return {}; } }

// Authorization Code login (user)
app.get('/auth/spotify/login', (req, res) => {
	if (!CLIENT_ID) return res.status(500).send('Missing SPOTIFY_CLIENT_ID');
	const redirectUri = req.query.redirectUri;
	if (!redirectUri) return res.status(400).send('redirectUri required');
	const state = encodeState({ r: redirectUri, n: crypto.randomBytes(8).toString('hex') });
	const scope = (req.query.scope || DEFAULT_SCOPES.join(' '));
	const authUrl = new URL('https://accounts.spotify.com/authorize');
	authUrl.searchParams.set('client_id', CLIENT_ID);
	authUrl.searchParams.set('response_type', 'code');
	authUrl.searchParams.set('redirect_uri', CALLBACK_URL);
	authUrl.searchParams.set('scope', scope);
	authUrl.searchParams.set('state', state);
	return res.redirect(authUrl.toString());
});

app.get(CALLBACK_PATH, async (req, res) => {
	const { code, state } = req.query;
	if (!code || !state) return res.status(400).send('Missing code/state');
	const s = decodeState(state);
	const redirectUri = s.r;
	if (!redirectUri) return res.status(400).send('Invalid state');
	try {
		const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
			},
			body: new URLSearchParams({ grant_type: 'authorization_code', code: String(code), redirect_uri: CALLBACK_URL }).toString(),
		});
		if (!tokenRes.ok) return res.status(500).send('Token exchange failed');
		const token = await tokenRes.json();
		const url = new URL(redirectUri);
		const hash = new URLSearchParams({ access_token: token.access_token, token_type: token.token_type || 'Bearer', expires_in: String(token.expires_in || 3600) }).toString();
		return res.redirect(url.toString() + '#' + hash);
	} catch (e) { return res.status(500).send('Auth error: ' + e.message); }
});

// Client Credentials (app token) cache
let appToken = null; // { access_token, expires_at }
async function getAppToken() {
	if (appToken && appToken.expires_at > Date.now() + 60000) return appToken.access_token;
	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
	});
	if (!res.ok) throw new Error('Failed to get app token');
	const data = await res.json();
	appToken = { access_token: data.access_token, expires_at: Date.now() + (data.expires_in || 3600) * 1000 };
	return appToken.access_token;
}

// Simple language query map
const LANGUAGE_QUERIES = {
	english: ['Top Hits', "Today's Top Hits", 'Global Top 50'],
	hindi: ['Trending Now Hindi', 'Hot Hits Hindi', 'Bollywood Hits'],
	tamil: ['Trending Now Tamil', 'Hot Hits Tamil'],
	telugu: ['Trending Now Telugu', 'Hot Hits Telugu'],
	malayalam: ['Trending Now Malayalam', 'Hot Hits Malayalam'],
	kannada: ['Trending Now Kannada', 'Hot Hits Kannada'],
	marathi: ['Trending Now Marathi', 'Marathi Hits']
};

// Fetch playlists by language (public)
app.get('/spotify/playlists', async (req, res) => {
	try {
		const lang = String(req.query.lang || 'english').toLowerCase();
		const limit = Math.min(parseInt(String(req.query.limit || '24'), 10) || 24, 50);
		const token = await getAppToken();
		const qList = LANGUAGE_QUERIES[lang] || LANGUAGE_QUERIES.english;
		const results = [];
		for (const q of qList) {
			const searchUrl = new URL('https://api.spotify.com/v1/search');
			searchUrl.searchParams.set('q', q);
			searchUrl.searchParams.set('type', 'playlist');
			searchUrl.searchParams.set('limit', String(limit));
			const r = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
			if (!r.ok) continue;
			const data = await r.json();
			(data.playlists?.items || []).forEach((pl) => {
				results.push({ id: pl.id, name: pl.name, image: pl.images?.[0]?.url || '', owner: pl.owner?.display_name || '', tracksTotal: pl.tracks?.total || 0 });
			});
		}
		// Deduplicate by id
		const seen = new Set();
		const unique = results.filter(p => (seen.has(p.id) ? false : (seen.add(p.id), true))).slice(0, limit);
		return res.json({ playlists: unique });
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => { console.log(`Spotify auth server running on http://localhost:${PORT}`); });
