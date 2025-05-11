# Media downloader Telegram bot

The bot gets the message, parse it for media URL, tries to download it with [yt-dlp](https://github.com/yt-dlp/yt-dlp),
and sends the media back to the chat.

Uses:
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - media downloader
- [yt-dlp-wrap](https://github.com/foxesdocode/yt-dlp-wrap) - nodejs wrap of yt-dlp
- [telegraf](https://github.com/telegraf/telegraf) - Telegram API framework

# Installation

1. [Install yt-dlp](https://github.com/yt-dlp/yt-dlp/wiki/Installation)
2. Clone the bot repository
3. Create directory for downloaded files
4. Copy `.env.sample` to `.env` and fill the file according to the comments
5. Build js app with `npm run build`
6. Run with `npm run start` or with pm2 by copying `ecosystem.config.sample.js` to `ecosystem.config.js`
   and starting it with `pm2 start ecosystem.config.js`