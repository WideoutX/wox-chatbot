# WOX Chat Widget

A minimal, embeddable chat widget for [Workato Genie](https://docs.workato.com/agentic/agent-studio/) endpoints. Drop it on any site with two `<script>` tags.

## Files

- **`wox-chat-widget.js`** — the library. Host this anywhere (GitHub Pages, CDN, your own server).
- **`index.html`** — a standalone demo page that loads the library and initializes it.

## Quick start (local)

1. Open `index.html`.
2. Replace `PASTE_YOUR_ROTATED_TOKEN_HERE` with your Workato API token.
3. Confirm the `endpoint` URL matches yours.
4. Open the file in a browser — the chat bubble appears in the bottom-right.

## Host on GitHub Pages

1. Create a new GitHub repo (public, e.g. `wox-chat-widget`).
2. Upload `wox-chat-widget.js` and `index.html` to the repo root.
3. Repo → **Settings → Pages** → Source: `main` branch, root folder → Save.
4. After a minute, your library is live at:
   ```
   https://<your-username>.github.io/wox-chat-widget/wox-chat-widget.js
   ```
5. Demo page lives at:
   ```
   https://<your-username>.github.io/wox-chat-widget/
   ```

## Embed on another site

Paste these two tags before the closing `</body>` on any page:

```html
<script src="https://<your-username>.github.io/wox-chat-widget/wox-chat-widget.js"></script>
<script>
  WoxChat.init({
    endpoint:       'https://apim.workato.com/<your-handle>/<collection>/<endpoint>',
    apiToken:       'YOUR_TOKEN',
    title:          'Support',
    subtitle:       'We typically reply instantly',
    welcomeMessage: 'Hi! How can I help?',
    primaryColor:   '#0b5cff',
    position:       'bottom-right'
  });
</script>
```

## Config options

| Option           | Required | Default            | Description                                         |
|------------------|----------|--------------------|-----------------------------------------------------|
| `endpoint`       | yes      | —                  | Full Workato API endpoint URL                       |
| `apiToken`       | yes      | —                  | Workato API client token                            |
| `title`          | no       | `'Chat'`           | Header title                                        |
| `subtitle`       | no       | `''`               | Small text under the title                          |
| `welcomeMessage` | no       | `'Hi! How can I help?'` | First bot message shown when widget opens      |
| `primaryColor`   | no       | `'#0b5cff'`        | Button + header + user bubble color (any CSS color) |
| `position`       | no       | `'bottom-right'`   | `'bottom-right'` or `'bottom-left'`                 |

## JavaScript API

```js
WoxChat.open();   // open the panel
WoxChat.close();  // close the panel
WoxChat.reset();  // clear messages and start a new genie conversation
```

## CORS

Your Workato API collection must allow cross-origin requests from the domain hosting the widget. If you see CORS errors in the browser console, configure CORS on the collection (API platform → your collection → Settings) to allow your origin.

## Token security — please read

The API token is embedded in client-side JavaScript, so anyone who visits your page can extract it from the page source. This is **fine for internal tools, prototypes, and password-protected pages**, and **not fine for public-facing production sites**.

For public sites, run a tiny backend proxy:

```
Browser widget  →  POST /api/chat  →  Your server (holds token)  →  Workato
```

Then point the widget's `endpoint` at your server (`/api/chat`) and set `apiToken` to anything (or remove the header in your fork). Your server adds the real Workato token server-side.

## License

MIT — do whatever you want.