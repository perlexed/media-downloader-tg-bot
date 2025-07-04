import {Telegraf} from "telegraf";
import {UserFromGetMe} from "@telegraf/types";
import {Message} from "@telegraf/types/message";
import {processTelegramMessage} from "./message-parser";
import {message} from "telegraf/filters";
import {InputFile} from "telegraf/src/core/types/typegram";


export interface BotNarrowedContext {
    message: Message.TextMessage,
    botInfo: UserFromGetMe,
    reply: (messageText: string) => Promise<Message.TextMessage>,
    replyWithVideo: (videoInfo: string | InputFile) => Promise<Message.VideoMessage>,
    sendError: (errorText: string) => Promise<Message.TextMessage | null>,
}


const getLaunchParams = () => (process.env.WEBHOOK_DOMAIN && process.env.WEBHOOK_PORT
    ? {
        webhook: {
            domain: `https://${process.env.WEBHOOK_DOMAIN}/bot${process.env.BOT_TOKEN}`,
            port: parseInt(process.env.WEBHOOK_PORT, 10),
        }
    }
    : {}
);

const isTelegramTooLargeError = (error: unknown) => error && typeof error === 'object' && (error as any)?.response?.error_code === 413;


const onTelegramMessageHandler = async (ctx: BotNarrowedContext): Promise<any> => {
    try {
        return await processTelegramMessage(ctx);
    } catch (error) {
        console.error(error);

        // Mark telegram upload limit
        const errorMessage = isTelegramTooLargeError(error)
            ? 'Video too large, must be <50 Mb'
            : 'Error while downloading the file';

        const shouldErrorBeReported = !isTelegramTooLargeError(error);

        if (shouldErrorBeReported) {
            await ctx.sendError(error as string);
        }

        return ctx.reply(errorMessage);
    }
};

const sendError = (errorText: string, ctx: any) => {
    if (!process.env.REPORT_CHAT_ID) {
        return Promise.resolve(null);
    }

    const reportChatId = process.env.REPORT_CHAT_ID;
    const markdownV2ErrorText = 'message text: '
        + ctx.message.text
            .replaceAll('.', '\\.')
            .replaceAll('-', '\\-')
            .replaceAll('=', '\\=')
        + '\n\n'
        + '```\n' + errorText + '\n```';

    return ctx.telegram.sendMessage(
        reportChatId,
        markdownV2ErrorText,
        {parse_mode: 'MarkdownV2'},
    ).catch(() => {
        return ctx.telegram.sendMessage(
            reportChatId,
            'message text: ' + ctx.message.text + '\n\n' + '```\n' + errorText + '\n```',
        );
    });
};

const createBot = (botToken: string) => (new Telegraf(botToken)
    .start((ctx) => ctx.reply('Welcome to media downloader bot'))
    .help((ctx) => ctx.reply('Send me a URL to media (instagram, x.com, ...), and I\'ll download it and send it back as a video'))
    .on(
        message('text'),
        async (ctx) => onTelegramMessageHandler({
            message: ctx.message,
            botInfo: ctx.botInfo,
            reply: ctx.reply.bind(ctx),
            replyWithVideo: ctx.replyWithVideo.bind(ctx),
            sendError: (errorText) => sendError(errorText, ctx),
        }),
    )
    .catch((err, ctx) => {
        console.error(`Error for ${ctx.updateType}:`, err);
        ctx.reply('An error occurred while processing your request.');
    })
);

export const startTelegramBot = () => {
    const botToken = process.env.BOT_TOKEN;

    if (
        !botToken
        || !process.env.DOWNLOAD_DIR
    ) {
        throw new Error('BOT_TOKEN and DOWNLOAD_DIR environment variables must be set');
    }

    const bot = createBot(botToken);

    bot
        .launch(getLaunchParams())
        .then(() => console.log('Bot started successfully'))
        .catch((err) => console.error('Error starting bot:', err));

    const getBotShutdownCallback = (reason: string) => {
        return () => bot.stop(reason);
    };

    process
        .once('SIGINT', getBotShutdownCallback('SIGINT'))
        .once('SIGTERM', getBotShutdownCallback('SIGTERM'));
};