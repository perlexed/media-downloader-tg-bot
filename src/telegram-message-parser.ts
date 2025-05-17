import {Context, Input} from "telegraf";
import {unlinkSync} from "fs";
import {InputFile} from "telegraf/src/core/types/typegram";
import {NarrowedContext} from "telegraf/typings/context";
import {Message} from '@telegraf/types/message';
import {Update} from '@telegraf/types/update';
import {downloadMedia, getVideoInfo} from "./media-downloader";
import {VideoCacheHelper} from "./video-cache-helper";

// Either it's downloaded file with file path, or a telegram video id string
type VideoToUpload = {videoFile: InputFile, localFilePath: string} | string;
type VideoUploadResult = Promise<[VideoToUpload, {videoId: string, videoExtractor: string} | null]>;

const getVideoToUpload = async (downloadUrl: string): VideoUploadResult => {
    const fileInfo = await getVideoInfo(downloadUrl);

    const videoId = fileInfo?.id;
    const videoExtractor = fileInfo?.extractor;
    const isCacheKeyAvailable = videoId && videoExtractor;

    if (isCacheKeyAvailable) {
        const cachedTelegramVideoId = VideoCacheHelper.instance.getVideoIdFromCache(videoId, videoExtractor);

        if (cachedTelegramVideoId) {
            return [Input.fromFileId(cachedTelegramVideoId), null];
        }
    }

    const filePath = await downloadMedia(downloadUrl);
    const downloadedFileInput = Input.fromLocalFile(filePath);

    return [
        {videoFile: downloadedFileInput, localFilePath: filePath},
        isCacheKeyAvailable ? {videoId, videoExtractor} : null,
    ];
};

export const processTelegramMessage = async (ctx:  NarrowedContext<Context<Update>, Update.MessageUpdate<Record<"text", {}> & Message.TextMessage>>) => {
    const messageText = ctx.message.text;

    if (!messageText) {
        return;
    }

    const isPrivateChat = ctx.message.chat.type === 'private';
    const isBotMentioned = ctx.message.entities?.some(entity =>
        entity.type === 'mention' &&
        messageText.includes(`@${ctx.botInfo.username}`)
    );

    if (!isPrivateChat && !isBotMentioned) {
        return;
    }

    // E.g. 'https://google.com'
    const httpsUrlRegex = new RegExp(
        'https?:\\/\\/(?:www\\.)?[^\\s/$.?#]{1,256}\\.[^\\s]{1,6}(?:[^\\s?#]*)?(?:\\?[^\\s#]*)?(?:#\\S*)?',
        'gm',
    );

    const urls = messageText.match(httpsUrlRegex);

    if (!urls) {
        await ctx.reply("Given text has no URL to download");
        return;
    }

    const downloadUrl = urls[0];

    if (urls.length > 1) {
        await ctx.reply(`Text has multiple URLs, using the first one: ${downloadUrl}`);
    }

    console.log(new Date().toLocaleString(), `Processing URL: ${downloadUrl}`);

    const [videoInput, cacheKeyData] = await getVideoToUpload(downloadUrl);

    // If the video is already uploaded to telegram then no notification is needed as the response will be very fast
    if (typeof videoInput === 'string') {
        await ctx.replyWithVideo(videoInput);
        return;
    }

    const {videoFile, localFilePath} = videoInput;

    await ctx.reply('Media downloaded, sending it to telegram');
    const telegramUploadResult = await ctx.replyWithVideo(videoFile);

    unlinkSync(localFilePath);

    if (cacheKeyData !== null) {
        VideoCacheHelper.instance.saveTelegramVideoIdToCache(
            cacheKeyData.videoId,
            cacheKeyData.videoExtractor,
            telegramUploadResult.video.file_id,
        );
    }
};
