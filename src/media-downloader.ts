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

    const ytDlpOptions = [
        downloadUrl,
        '-o', outputFilename,
        '-P', downloadDir,
    ];

    return new Promise<string>((resolve, reject) => {
        try {
            const ytDlpEventEmitter = (new YTDlpWrap())
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