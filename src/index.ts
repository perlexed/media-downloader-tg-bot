import {Telegraf} from 'telegraf';
import dotenv from 'dotenv';
import setupBot from "./telegram-bot";

dotenv.config();

if (
    !process.env.BOT_TOKEN
    || !process.env.DOWNLOAD_DIR
) {
    throw new Error('All .env params must be present. See .env.sample for the list of params');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

setupBot(bot);

const launchParams = process.env.WEBHOOK_DOMAIN && process.env.WEBHOOK_PORT
    ? {
        webhook: {
            domain: `https://${process.env.WEBHOOK_DOMAIN}/bot${process.env.BOT_TOKEN}`,
            port: parseInt(process.env.WEBHOOK_PORT, 10),
        }
    }
    : {};

bot
    .launch(launchParams)
    .then(() => console.log('Bot started successfully'))
    .catch((err) => console.error('Error starting bot:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));