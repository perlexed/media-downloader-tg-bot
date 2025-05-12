import {join} from 'path';
import {randomUUID} from 'crypto';
import YTDlpWrap from 'yt-dlp-wrap';


export default function (downloadUrl: string): Promise<string> {
    const outputFilename = `${randomUUID()}.mp4`;
    const isVerbose = process.env.VERBOSE && Boolean(parseInt(process.env.VERBOSE, 10));
    const downloadDir = join(
        process.cwd(),
        process.env.DOWNLOAD_DIR as string,
    );

    const ytDlpCookiesParam = process.env.YTDLP_COOKIES_PATH
        ? ['--cookies', process.env.YTDLP_COOKIES_PATH]
        : []

    const ytDlpOptions = [
        downloadUrl,
        // Depending on whether ffmpeg is available the format may be different
        // Setting this format should prevent this behavior
        '-f', 'best/bestvideo+bestaudio',
        '-o', outputFilename,
        '-P', downloadDir,
        ...ytDlpCookiesParam,
    ];

    const YTDlpWrapInstance = process.env.YTDLP_PATH
        ? new YTDlpWrap(process.env.YTDLP_PATH)
        : new YTDlpWrap();

    return new Promise<string>((resolve, reject) => {
        try {
            const ytDlpEventEmitter = YTDlpWrapInstance
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
}