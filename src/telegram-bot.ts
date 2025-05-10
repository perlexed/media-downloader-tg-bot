import {Input, Telegraf} from "telegraf";
import downloadMedia from "./media-downloader";

export default function (bot: Telegraf) {
    bot.start((ctx) => ctx.reply('Welcome to media downloader bot'));
    bot.help((ctx) => ctx.reply('Send me a URL to media (instagram, x.com, ...), and I\'ll download it and send it back as a video'));

    bot.on('text', (ctx) => {
        const messageText = ctx.message.text;

        if (!messageText) {
            ctx.reply("No text was provided");
            return;
        }

        // E.g. 'https://google.com'
        const httpsUrlRegex = new RegExp(
            'https?:\\/\\/(?:www\\.)?[^\\s/$.?#]{1,256}\\.[^\\s]{1,6}(?:[^\\s?#]*)?(?:\\?[^\\s#]*)?(?:#\\S*)?',
            'gm',
        );

        const urls = messageText.match(httpsUrlRegex);

        if (!urls) {
            ctx.reply("Given text has no URL to download");
            return;
        }

        const downloadUrl = urls[0];

        if (urls.length > 1) {
            ctx.reply(`Text has multiple URLs, using the first one: ${downloadUrl}`);
        }

        const downloadPromise = downloadMedia(downloadUrl);

        downloadPromise
            .then(filePath => {
                const downloadedFileInput = Input.fromLocalFile(filePath);
                return ctx.replyWithVideo(downloadedFileInput);
            })
            .catch(() => {
                ctx.reply('Error while downloading the file');
            });
    });

    // Error handling
    bot.catch((err, ctx) => {
        console.error(`Error for ${ctx.updateType}:`, err);
        ctx.reply('An error occurred while processing your request.');
    });
}
