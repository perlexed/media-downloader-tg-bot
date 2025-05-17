import {Telegraf} from 'telegraf';
import {message} from "telegraf/filters";
import dotenv from 'dotenv';
import {processTelegramMessage} from "./telegram-message-parser";
import {VideoCacheHelper} from "./video-cache-helper";

dotenv.config();

if (
    !process.env.BOT_TOKEN
    || !process.env.DOWNLOAD_DIR
) {
    throw new Error('All .env params must be present. See .env.sample for the list of params');
}

VideoCacheHelper.init(process.env.CACHE_FILE_PATH || 'cache.txt');

const botLaunchParams = process.env.WEBHOOK_DOMAIN && process.env.WEBHOOK_PORT
    ? {
        webhook: {
            domain: `https://${process.env.WEBHOOK_DOMAIN}/bot${process.env.BOT_TOKEN}`,
            port: parseInt(process.env.WEBHOOK_PORT, 10),
        }
    }
    : {};

const telegramBot = new Telegraf(process.env.BOT_TOKEN)
    .start((ctx) => ctx.reply('Welcome to media downloader bot'))
    .help((ctx) => ctx.reply('Send me a URL to media (instagram, x.com, ...), and I\'ll download it and send it back as a video'))
    .on(message('text'), async (ctx) => {
        try {
            await processTelegramMessage(ctx);
        } catch (error) {
            console.error(error);
            ctx.reply('Error while downloading the file');
        }
    })
    .catch((err, ctx) => {
        console.error(`Error for ${ctx.updateType}:`, err);
        ctx.reply('An error occurred while processing your request.');
    });

telegramBot
    .launch(botLaunchParams)
    .then(() => console.log('Bot started successfully'))
    .catch((err) => console.error('Error starting bot:', err));

const getBotShutdownCallback = (reason: string) => {
    return () => telegramBot.stop(reason);
};

process.once('SIGINT', getBotShutdownCallback('SIGINT'));
process.once('SIGTERM', getBotShutdownCallback('SIGTERM'));