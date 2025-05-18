import {join} from 'path';
import {randomUUID} from 'crypto';
import YTDlpWrap from 'yt-dlp-wrap';

const getYtDlpWrap = () => {
    return process.env.YTDLP_PATH
        ? new YTDlpWrap(process.env.YTDLP_PATH)
        : new YTDlpWrap();
};

const getCommonYtDlpParams = () => {
    const ytDlpCookiesParam = process.env.YTDLP_COOKIES_PATH
        ? ['--cookies', process.env.YTDLP_COOKIES_PATH]
        : []

    return [
        // Depending on whether ffmpeg is available the format may be different
        // Setting this format should prevent this behavior
        '-f', 'best/bestvideo+bestaudio',
        ...ytDlpCookiesParam,
    ];
};

export const getVideoInfo = async (videoUrl: string): Promise<any|null> => {
    try {
        return await getYtDlpWrap()
            .getVideoInfo([
                videoUrl,
                ...getCommonYtDlpParams(),
            ])
    } catch (error) {
        return null;
    }
};

export const downloadMedia = (downloadUrl: string): Promise<string> => {
    const outputFilename = `${randomUUID()}.mp4`;
    const isVerbose = process.env.VERBOSE && Boolean(parseInt(process.env.VERBOSE, 10));
    const downloadDir = join(
        process.cwd(),
        process.env.DOWNLOAD_DIR as string,
    );

    const ytDlpOptions = [
        downloadUrl,
        '-o', outputFilename,
        '-P', downloadDir,
        ...getCommonYtDlpParams(),
    ];

    return new Promise<string>((resolve, reject) => {
        try {
            const ytDlpEventEmitter = getYtDlpWrap()
                .exec(ytDlpOptions)
                .on('error', (error) => {
                    reject(error);
                })
                .on('close', () => {
                    resolve(join(downloadDir, outputFilename));
                });

            if (isVerbose) {
                ytDlpEventEmitter.on(
                    'ytDlpEvent',
                    (eventType, eventData) => {
                        console.log(eventType, eventData);
                    },
                );
            }
        } catch (e) {
            reject(e);
        }
    });
};
