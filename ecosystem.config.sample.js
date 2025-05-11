module.exports = {
    apps: [{
        name: 'ytdlp-bot',
        script: 'dist/index.js',
        cwd: '/path/to/yt-dlp/media-downloader-tg-bot',
        error_file: '/path/to/yt-dlp/error.log',
        out_file: '/path/to/yt-dlp/out.log',
    }],
};