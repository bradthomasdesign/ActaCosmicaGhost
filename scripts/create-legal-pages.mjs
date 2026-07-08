// Creates (or updates, if they already exist) the Privacy Policy, Terms of
// Use, and Cookie Policy pages the theme's footer links to (/privacy/,
// /terms/, /cookies/). Not part of the shipped theme — a one-time content
// setup script, same pattern as migrate-from-astro.mjs.
//
// The content is a starting template, not legal advice — it fills in the
// site's actual title automatically, but still has bracketed placeholders
// ([contact email], [your jurisdiction], etc.) meant to be edited in Ghost
// Admin afterward, and assumes generic language until reviewed by an
// actual lawyer for the specific business using this theme.
//
// Usage:
//   GHOST_URL=http://localhost:2368 \
//   GHOST_ADMIN_KEY=<id:secret from Settings > Integrations> \
//   npm run create-legal-pages

import crypto from 'node:crypto';

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:2368';
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!ADMIN_KEY) throw new Error('Set GHOST_ADMIN_KEY=<id:secret> (Settings → Advanced → Integrations in Ghost Admin)');
const [KEY_ID, KEY_SECRET] = ADMIN_KEY.split(':');

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

const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

function pages(siteTitle) {
  return [
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      html: `
        <p><em>Last updated: ${today}</em></p>
        <p><strong>${siteTitle}</strong> ("we," "us," or "our") respects your privacy. This policy explains what information we collect, how we use it, and the choices you have.</p>
        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Account information.</strong> If you sign up as a free or paid member, we collect your email address and, optionally, your name.</li>
          <li><strong>Payment information.</strong> If you subscribe to a paid membership tier, payment is processed by Stripe. We do not store your card details ourselves — Stripe handles that directly under <a href="https://stripe.com/privacy">Stripe's own privacy policy</a>.</li>
          <li><strong>Newsletter subscribers.</strong> If you sign up for our newsletter without becoming a full member, we collect your email address to send you updates, and you can unsubscribe at any time via the link in every email.</li>
          <li><strong>Usage data.</strong> We collect basic analytics (pages visited, referring site, approximate location from IP address) to understand how the site is used.</li>
          <li><strong>Comments.</strong> If you leave a comment on an article, your name and comment text are visible publicly.</li>
        </ul>
        <h2>How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and maintain your membership or subscription</li>
          <li>Send newsletters and account-related emails</li>
          <li>Understand site usage and improve our content</li>
          <li>Communicate with you about your account, when necessary</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>
        <h2>Third-Party Services</h2>
        <p>Our site uses the following third-party services, each with their own privacy practices:</p>
        <ul>
          <li><strong>[Hosting provider]</strong> — hosts our site and member data</li>
          <li><strong>Stripe</strong> — processes payments for paid memberships</li>
          <li><strong>Google Fonts</strong> — loads our site's typefaces</li>
          <li><strong>[Email provider]</strong> — delivers newsletter and transactional emails</li>
        </ul>
        <h2>Your Rights</h2>
        <p>Depending on where you live, you may have the right to access, correct, or delete your personal data, and to object to or restrict certain processing. To exercise these rights, contact us at <strong>[contact email]</strong>.</p>
        <h2>Cookies</h2>
        <p>See our <a href="/cookies/">Cookie Policy</a> for details on the cookies we use.</p>
        <h2>Data Retention</h2>
        <p>We retain your account information for as long as your membership is active, or as needed to comply with our legal obligations.</p>
        <h2>Changes to This Policy</h2>
        <p>We may update this policy from time to time. We'll post the updated version here with a new "Last updated" date.</p>
        <h2>Contact Us</h2>
        <p>Questions about this policy? Email us at <strong>[contact email]</strong>.</p>
      `,
    },
    {
      slug: 'terms',
      title: 'Terms of Use',
      html: `
        <p><em>Last updated: ${today}</em></p>
        <p>Welcome to <strong>${siteTitle}</strong>. By accessing or using our site, you agree to these Terms of Use.</p>
        <h2>Our Service</h2>
        <p>${siteTitle} is a publication covering [topic areas]. We offer free content, an optional email newsletter, and paid membership tiers with additional benefits.</p>
        <h2>Membership &amp; Subscriptions</h2>
        <ul>
          <li><strong>Free membership</strong> gives you access to free content and our newsletter.</li>
          <li><strong>Paid membership</strong> ([tier names], billed monthly or annually) unlocks member-only and premium content. Payments are processed securely through Stripe.</li>
          <li>You may cancel a paid subscription at any time from your account settings; cancellation takes effect at the end of your current billing period, and we do not offer partial refunds for unused time unless required by law.</li>
          <li>We may change membership pricing with advance notice to existing members.</li>
        </ul>
        <h2>Acceptable Use</h2>
        <p>When using our site, you agree not to:</p>
        <ul>
          <li>Post unlawful, defamatory, or harassing content in comments</li>
          <li>Attempt to gain unauthorized access to member accounts or site systems</li>
          <li>Use automated tools to scrape or republish our content without permission</li>
          <li>Share paid-member content with non-members in violation of your membership terms</li>
        </ul>
        <h2>Intellectual Property</h2>
        <p>Unless otherwise noted, all articles, images, and other content on this site are owned by ${siteTitle} or its contributors and may not be reproduced without permission. You may share links to our content and quote brief excerpts with attribution.</p>
        <h2>Comments</h2>
        <p>If we enable commenting, you're responsible for what you post. We reserve the right to remove any comment or restrict any user for violating these terms.</p>
        <h2>Disclaimers</h2>
        <p>Content on this site is provided for informational purposes and does not constitute professional advice. We make reasonable efforts to ensure accuracy but do not guarantee that all content is complete, current, or error-free.</p>
        <h2>Limitation of Liability</h2>
        <p>To the fullest extent permitted by law, ${siteTitle} is not liable for any indirect, incidental, or consequential damages arising from your use of the site.</p>
        <h2>Changes to These Terms</h2>
        <p>We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.</p>
        <h2>Governing Law</h2>
        <p>These terms are governed by the laws of <strong>[your jurisdiction]</strong>.</p>
        <h2>Contact Us</h2>
        <p>Questions about these terms? Email us at <strong>[contact email]</strong>.</p>
      `,
    },
    {
      slug: 'cookies',
      title: 'Cookie Policy',
      html: `
        <p><em>Last updated: ${today}</em></p>
        <p>This policy explains how <strong>${siteTitle}</strong> uses cookies and similar technologies.</p>
        <h2>What Are Cookies?</h2>
        <p>Cookies are small text files stored on your device that help websites remember information about your visit.</p>
        <h2>Cookies We Use</h2>
        <table>
          <thead><tr><th>Type</th><th>Purpose</th></tr></thead>
          <tbody>
            <tr><td><strong>Essential/session cookies</strong></td><td>Keep you signed in as a member, remember items like your saved preferences, and enable core site functionality. These can't be disabled without affecting how the site works.</td></tr>
            <tr><td><strong>Member authentication cookies</strong></td><td>Set by Ghost's membership system when you sign in, so you don't have to log in on every page.</td></tr>
            <tr><td><strong>Analytics cookies</strong></td><td>Help us understand how visitors use the site, so we can improve it.</td></tr>
            <tr><td><strong>Payment cookies</strong></td><td>Set by Stripe during checkout, if you subscribe to a paid membership.</td></tr>
          </tbody>
        </table>
        <p>We do not use cookies for third-party advertising or ad retargeting.</p>
        <h2>Managing Cookies</h2>
        <p>Most browsers let you control cookies through their settings — you can block or delete cookies, though doing so may affect your ability to stay signed in or use certain features. Since essential cookies are required for the site's core functionality (like staying logged in), blocking them may prevent parts of the site from working properly.</p>
        <h2>Changes to This Policy</h2>
        <p>We may update this policy from time to time. We'll post the updated version here with a new "Last updated" date.</p>
        <h2>Contact Us</h2>
        <p>Questions about our use of cookies? Email us at <strong>[contact email]</strong>.</p>
      `,
    },
  ];
}

async function upsertPage(def) {
  const existing = await api(`/pages/slug/${def.slug}/`);
  const existingPage = existing?.pages?.[0];

  if (existingPage) {
    const res = await api(`/pages/${existingPage.id}/?source=html`, {
      method: 'PUT',
      body: JSON.stringify({ pages: [{ updated_at: existingPage.updated_at, html: def.html }] }),
    });
    if (res) console.log(`Updated existing page: /${def.slug}/`);
    return;
  }

  const res = await api('/pages/?source=html', {
    method: 'POST',
    body: JSON.stringify({ pages: [{ title: def.title, slug: def.slug, html: def.html, status: 'published' }] }),
  });
  if (res) console.log(`Created page: /${def.slug}/`);
}

async function main() {
  const site = await api('/site/');
  const siteTitle = site?.site?.title || '[Site Name]';
  console.log(`Using site title: ${siteTitle}`);

  for (const def of pages(siteTitle)) {
    await upsertPage(def);
  }

  console.log('\nDone. Remember to fill in the remaining bracketed placeholders');
  console.log('([contact email], [your jurisdiction], [Hosting provider], etc.)');
  console.log('directly in Ghost Admin before publishing for real — this is');
  console.log('starting template content, not reviewed legal advice.');
}

main();
