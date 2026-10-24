// One-time migration tool: reads the original Acta Cosmica Astro theme's
// markdown articles and recreates them as real Ghost Posts/Tags/Authors via
// the Admin API. Not part of the shipped theme — a dev tool for bringing a
// Ghost site up to parity with the old Astro demo content.
//
// Usage:
//   GHOST_URL=http://localhost:2368 \
//   GHOST_ADMIN_KEY=<id:secret from Settings > Integrations> \
//   ASTRO_SOURCE_DIR=/path/to/markur \
//   npm run migrate
//
// Author bylines require real Ghost staff accounts (no lightweight "guest
// author" exists in core Ghost). Run `npm run migrate -- invite-authors`
// first, have each person accept their invite email, then run
// `npm run migrate` (no args) to create tags/authors/posts.
//
// Author bio/photo/location can't be set by the Admin API integration key —
// Ghost restricts editing OTHER staff members' profiles to a real logged-in
// session (403s otherwise). To set all 5 authors' profiles in one shot
// instead of doing it by hand in Settings → Staff for each one, run:
//
//   GHOST_URL=http://localhost:2368 \
//   GHOST_ADMIN_KEY=<id:secret> \
//   GHOST_OWNER_EMAIL=<your Ghost owner login email> \
//   GHOST_OWNER_PASSWORD=<your Ghost owner login password> \
//   ASTRO_SOURCE_DIR=/path/to/markur \
//   npm run migrate -- fix-author-photos
//
// This logs in as the owner (the same auth Ghost Admin's own UI uses) just
// for that one step — your password is only ever read from the environment
// on your own machine, never written anywhere or sent anywhere but Ghost's
// own /session/ endpoint.
//
// If posts already exist on the target site (e.g. imported via Ghost's own
// Settings → Advanced → Export/Import, which preserves feature_image as a
// URL pointing back at wherever the export was taken from — useless once
// that source isn't reachable) but are missing their feature image, fix
// them up in place by slug instead of re-importing/duplicating:
//
//   GHOST_URL=https://your-site.magicpages.co \
//   GHOST_ADMIN_KEY=<id:secret> \
//   ASTRO_SOURCE_DIR=/path/to/markur \
//   npm run migrate -- fix-feature-images

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import { marked } from 'marked';

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:2368';
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;
const SOURCE_DIR = process.env.ASTRO_SOURCE_DIR || path.resolve(import.meta.dirname, '../../markur');
const ARTICLES_DIR = path.join(SOURCE_DIR, 'src/content/articles');
const IMAGES_DIR = path.join(SOURCE_DIR, 'src/assets/images');

if (!ADMIN_KEY) throw new Error('Set GHOST_ADMIN_KEY=<id:secret> (Settings → Advanced → Integrations in Ghost Admin)');
const [KEY_ID, KEY_SECRET] = ADMIN_KEY.split(':');

const CATEGORIES = [
  { slug: 'science', name: 'Science', description: 'The discoveries, breakthroughs, and open questions shaping how we understand the universe.' },
  { slug: 'animals', name: 'Animals', description: 'The creatures we share the planet with.' },
  { slug: 'environment', name: 'Environment', description: 'The state of the natural world and the forces reshaping it.' },
  { slug: 'history', name: 'History', description: 'The past, recovered through archaeology, archives, and oral history.' },
  { slug: 'travel', name: 'Travel', description: 'Places worth going to, and the stories you only find when you get there.' },
  { slug: 'space', name: 'Space', description: 'The cosmos — its scale, its strangeness, and our attempts to understand it.' },
  { slug: 'culture', name: 'Culture', description: 'Ideas, art, and the things that shape how we make meaning of the world.' },
];

const AUTHORS = [
  { id: 'sorensen', email: 'elena@actacosmica.com', bio: "Elena leads Acta Cosmica's newsroom and reports on the changing planet — from vanishing glaciers to the science of a warming ocean.", location: 'Reykjavík', role: 'Editor in Chief', twitter: null, image: 'author-elena.jpg' },
  { id: 'ito', email: 'marcus@actacosmica.com', bio: 'Marcus oversees daily editorial operations and covers physics, materials science, and the engineering of discovery.', location: 'Tokyo', role: 'Managing Editor', twitter: null, image: 'author-marcus.jpg' },
  { id: 'whitcombe', email: 'dana@actacosmica.com', bio: "Dana leads Acta Cosmica's visual journalism and reports on neuroscience, ecology, and the natural world.", location: 'Cape Town', role: 'Director of Photography', twitter: null, image: 'author-dana.jpg' },
  { id: 'raman', email: 'priya@actacosmica.com', bio: 'Priya leads science coverage at Acta Cosmica, with a focus on health, longevity, and human biology.', location: 'London', role: 'Head of Science', twitter: null, image: 'author-priya.jpg' },
  { id: 'alvarez', email: 'rafael@actacosmica.com', bio: 'Rafael covers astronomy, physics, and the instruments that make discovery possible.', location: 'Santiago', role: 'Senior Science Correspondent', twitter: null, image: 'author-alvarez.jpg' },
];

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeToken() {
  const header = { alg: 'HS256', typ: 'JWT', kid: KEY_ID };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + 300, aud: '/admin/' };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = crypto.createHmac('sha256', Buffer.from(KEY_SECRET, 'hex')).update(signingInput).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signingInput}.${sig}`;
}

async function api(pathname, opts = {}) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin${pathname}`, {
    ...opts,
    headers: { Authorization: `Ghost ${makeToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    console.error(`FAILED ${opts.method || 'GET'} ${pathname} -> ${res.status}`, JSON.stringify(json));
    return null;
  }
  return json;
}

// Owner session login — the same auth Ghost Admin's own web UI uses. Needed
// only for PUT /users/:id/ on someone else's profile, which a JWT
// integration token is deliberately not allowed to do. Never logs the
// password; reads it from the environment once and discards it.
async function getOwnerSessionCookie() {
  const email = process.env.GHOST_OWNER_EMAIL;
  const password = process.env.GHOST_OWNER_PASSWORD;
  if (!email || !password) return null;
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/session/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: GHOST_URL },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) {
    console.error('Owner session login failed', res.status, await res.text());
    return null;
  }
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  // A single Set-Cookie header can carry multiple cookies separated by
  // comma-space in some fetch implementations; Ghost only ever sets one
  // session cookie here, so just take the first cookie-pair segment.
  return setCookie.split(';')[0];
}

// Ghost's session auth checks the Origin header against the site's own URL
// as CSRF protection on state-changing requests — same requirement as
// getOwnerSessionCookie above.
async function apiAsOwner(pathname, sessionCookie, opts = {}) {
  const res = await fetch(`${GHOST_URL}/ghost/api/admin${pathname}`, {
    ...opts,
    headers: { Cookie: sessionCookie, Origin: GHOST_URL, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    console.error(`FAILED (owner session) ${opts.method || 'GET'} ${pathname} -> ${res.status}`, JSON.stringify(json));
    return null;
  }
  return json;
}

const MIME_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml' };

const imageUrlCache = new Map();
async function uploadImage(localPath) {
  if (imageUrlCache.has(localPath)) return imageUrlCache.get(localPath);
  if (!fs.existsSync(localPath)) return null;
  const form = new FormData();
  const bytes = fs.readFileSync(localPath);
  const mime = MIME_TYPES[path.extname(localPath).toLowerCase()] || 'image/jpeg';
  form.append('file', new Blob([bytes], { type: mime }), path.basename(localPath));
  form.append('purpose', 'image');
  const res = await fetch(`${GHOST_URL}/ghost/api/admin/images/upload/`, {
    method: 'POST',
    headers: { Authorization: `Ghost ${makeToken()}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('image upload failed', localPath, JSON.stringify(json));
    return null;
  }
  const url = json.images[0].url;
  imageUrlCache.set(localPath, url);
  return url;
}

async function ensureTag(slug, name, description) {
  const found = await api(`/tags/?filter=${encodeURIComponent('slug:' + slug)}`);
  if (found?.tags?.length) return found.tags[0];
  const created = await api('/tags/', { method: 'POST', body: JSON.stringify({ tags: [{ slug, name, description }] }) });
  return created?.tags?.[0] ?? null;
}

async function inviteAuthors() {
  const roles = await api('/roles/');
  const authorRole = roles.roles.find((r) => r.name === 'Author');
  for (const author of AUTHORS) {
    const res = await api('/invites/', { method: 'POST', body: JSON.stringify({ invites: [{ email: author.email, role_id: authorRole.id }] }) });
    console.log(author.email, res ? 'invited' : 'FAILED (already invited/active?)');
  }
  console.log('\nHave each person accept their invite email, then re-run without the invite-authors argument.');
}

async function resolveAuthors(sessionCookie = null) {
  const map = {};
  let profileUpdatesBlocked = false;
  for (const author of AUTHORS) {
    const found = await api(`/users/?filter=${encodeURIComponent('email:' + author.email)}&status=all`);
    const user = found?.users?.[0];
    if (!user || user.status !== 'active') {
      console.warn(`⚠ ${author.email} hasn't accepted their invite yet — posts by "${author.id}" will be attributed to you instead.`);
      continue;
    }
    map[author.id] = user.id;

    // Admin API integration tokens can't edit OTHER staff members' profiles
    // (only their own, session-only) — this consistently 403s. With an
    // owner session cookie (see getOwnerSessionCookie / fix-author-photos)
    // this succeeds instead; otherwise each author fills in their own
    // bio/photo after signing in, same as any real newsroom onboarding a
    // writer.
    const imageUrl = await uploadImage(path.join(IMAGES_DIR, author.image));
    const body = JSON.stringify({ users: [{ bio: author.bio, location: author.location, meta_title: author.role, profile_image: imageUrl, updated_at: user.updated_at }] });
    const res = sessionCookie
      ? await apiAsOwner(`/users/${user.id}/`, sessionCookie, { method: 'PUT', body })
      : await api(`/users/${user.id}/`, { method: 'PUT', body });
    if (!res) profileUpdatesBlocked = true;
    else if (sessionCookie) console.log(`${author.email} profile updated (bio/location/photo)`);
  }
  if (profileUpdatesBlocked && !sessionCookie) {
    console.warn('\n⚠ Could not set author bio/photo/location — Ghost restricts editing other staff profiles to logged-in sessions, not API integrations. Run `npm run migrate -- fix-author-photos` with GHOST_OWNER_EMAIL/GHOST_OWNER_PASSWORD set to fix all of them in one shot, or each author can fill theirs in from Settings → Staff after signing in.');
  }
  return map;
}

function parseFrontmatterDate(raw) {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function stripCaptionPrefix(label) {
  return label ? label.replace(/^(PHOTO|VIDEO)\s*·\s*/i, '') : null;
}

async function migratePosts(categoryTags, authorMap, ownerId) {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const { data: fm, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');

    const existing = await api(`/posts/?filter=${encodeURIComponent('slug:' + slug)}`);
    if (existing?.posts?.length) {
      console.log(slug, 'already exists, skipping');
      continue;
    }

    const tags = [];
    if (categoryTags[fm.category]) tags.push({ id: categoryTags[fm.category].id });
    // The "chip" tag (tags[1], read by the theme's tag.hbs for subcategory
    // filtering) should always be a deliberate editorial label, not
    // whichever free-form keyword happens to be first in `tags:`. Prefer
    // subcategory; fall back to kicker, which every article has.
    const chipLabel = fm.subcategory || fm.kicker;
    let chipSlug = null;
    if (chipLabel) {
      const chipTag = await ensureTag(chipLabel.toLowerCase().replace(/\s+/g, '-'), chipLabel);
      if (chipTag) { tags.push({ id: chipTag.id }); chipSlug = chipTag.slug; }
    }
    for (const t of fm.tags || []) {
      const slug = t.toLowerCase().replace(/\s+/g, '-');
      if (slug === chipSlug) continue;
      const extraTag = await ensureTag(slug, t);
      if (extraTag) tags.push({ id: extraTag.id });
    }

    let feature_image = null;
    if (fm.image) {
      const imagePath = path.resolve(path.join(SOURCE_DIR, 'src/content/articles'), fm.image);
      feature_image = await uploadImage(imagePath);
    }

    const authorId = authorMap[fm.authorId] || ownerId;
    const html = marked.parse(content);

    const post = {
      title: fm.title,
      slug,
      custom_excerpt: fm.dek || null,
      html,
      feature_image,
      feature_image_caption: stripCaptionPrefix(fm.label),
      featured: Boolean(fm.featured || fm.heroOfDay),
      status: 'published',
      published_at: parseFrontmatterDate(fm.date),
      tags,
      authors: [{ id: authorId }],
    };

    const res = await api('/posts/?source=html', { method: 'POST', body: JSON.stringify({ posts: [post] }) });
    console.log(slug, res ? 'created' : 'FAILED');
  }
}

// Fixes up posts that were created before their author's invite was
// accepted (migratePosts falls back to the owner in that case, and never
// revisits existing posts on a later run). Re-reads each source file's
// authorId and PUTs the correct author onto the matching post by slug.
async function reassignAuthors(authorMap) {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const { data: fm } = matter(raw);
    const slug = file.replace(/\.md$/, '');
    const authorId = authorMap[fm.authorId];
    if (!authorId) continue;

    const found = await api(`/posts/?filter=${encodeURIComponent('slug:' + slug)}&include=authors`);
    const post = found?.posts?.[0];
    if (!post) continue;
    if (post.authors.length === 1 && post.authors[0].id === authorId) continue;

    const res = await api(`/posts/${post.id}/`, {
      method: 'PUT',
      body: JSON.stringify({ posts: [{ authors: [{ id: authorId }], updated_at: post.updated_at }] }),
    });
    console.log(slug, res ? `reassigned to ${fm.authorId}` : 'FAILED');
  }
}

const ASTRO_LIVE_URL = process.env.ASTRO_LIVE_URL || 'https://actacosmica.com';

// Pulls the og:image URL off the live Astro site's own article page — that
// site's images are already confirmed working in production (verified via
// a Lighthouse audit against it). Used as the source of truth instead of
// uploading a fresh copy through Ghost's own image storage, which on this
// particular target site accepts uploads (200 response, a URL comes back)
// but the resulting file 404s — confirmed both via the Admin API upload
// and a manual drag-and-drop upload straight in the Ghost editor. Whatever
// the actual cause on the hosting side, hotlinking a known-good URL sidesteps
// it entirely: no file storage step on the target site to fail.
async function fetchAstroLiveImageUrl(slug) {
  const res = await fetch(`${ASTRO_LIVE_URL}/article/${slug}`);
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/property="og:image" content="([^"]+)"/);
  return match ? match[1] : null;
}

// Fixes up posts that already exist on the target site but are missing (or
// have a broken) feature image — e.g. from a plain Ghost JSON export/import,
// which preserves feature_image as a URL pointing back at the *source* site
// rather than an actual file, or from Ghost's own image storage not actually
// persisting uploads on this target site (see fetchAstroLiveImageUrl above).
// This only sets a URL string on the post — no file upload involved, so it
// doesn't depend on the target site's storage working at all.
async function fixFeatureImages() {
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
    const { data: fm } = matter(raw);
    const slug = file.replace(/\.md$/, '');
    if (!fm.image) continue;

    const found = await api(`/posts/?filter=${encodeURIComponent('slug:' + slug)}`);
    const post = found?.posts?.[0];
    if (!post) { console.warn(slug, 'not found on target site, skipping'); continue; }

    const imageUrl = await fetchAstroLiveImageUrl(slug);
    if (!imageUrl) { console.warn(slug, `couldn't read og:image from ${ASTRO_LIVE_URL}/article/${slug} — is the live Astro site up?`); continue; }

    const res = await api(`/posts/${post.id}/`, {
      method: 'PUT',
      body: JSON.stringify({ posts: [{ feature_image: imageUrl, feature_image_caption: stripCaptionPrefix(fm.label), updated_at: post.updated_at }] }),
    });
    console.log(slug, res ? `feature image set -> ${imageUrl}` : 'FAILED');
  }
}

async function main() {
  if (process.argv[2] === 'invite-authors') {
    await inviteAuthors();
    return;
  }

  if (process.argv[2] === 'fix-author-photos') {
    const sessionCookie = await getOwnerSessionCookie();
    if (!sessionCookie) {
      throw new Error('Set GHOST_OWNER_EMAIL and GHOST_OWNER_PASSWORD (your Ghost owner login) to run this — an Admin API integration key cannot edit other staff members\' profiles, only a real logged-in session can.');
    }
    console.log('Logged in as owner. Setting author bio/location/photo for everyone who has accepted their invite...');
    await resolveAuthors(sessionCookie);
    console.log('Done.');
    return;
  }

  if (process.argv[2] === 'fix-feature-images') {
    console.log('Fixing missing/broken feature images on already-imported posts...');
    await fixFeatureImages();
    console.log('Done.');
    return;
  }

  if (process.argv[2] === 'reassign-authors') {
    console.log('Resolving accepted authors...');
    const authorMap = await resolveAuthors();
    console.log('Reassigning post authors...');
    await reassignAuthors(authorMap);
    console.log('Done.');
    return;
  }

  console.log('Ensuring category tags...');
  const categoryTags = {};
  for (const c of CATEGORIES) categoryTags[c.slug] = await ensureTag(c.slug, c.name, c.description);

  console.log('Resolving accepted authors...');
  const authorMap = await resolveAuthors();

  const me = await api('/users/?filter=' + encodeURIComponent('status:active') + '&limit=1&order=created_at%20asc');
  const ownerId = me.users[0].id;

  console.log('Migrating posts...');
  await migratePosts(categoryTags, authorMap, ownerId);

  console.log('Done.');
}

main();
