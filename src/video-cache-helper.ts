import {join} from 'path';
import {existsSync, readFileSync, writeFileSync, openSync} from "fs";

const VIDEO_ID_EXTRACTOR_NAME_DELIMITER = '-==-';
const RECORD_DELIMITER = '\t';

const readFileToLines = (filePath: string) => readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(fileString => fileString.trim())
    .filter(Boolean);

const getMapFromStrings = (fileStrings: string[]) => {
    const videoHashToTelegramVideoIdHash: Record<string, string> = {};

    fileStrings.forEach(fileString => {
        const [videoHash, telegramVideoId] = fileString.split(RECORD_DELIMITER);

        videoHashToTelegramVideoIdHash[videoHash] = telegramVideoId;
    });

    return videoHashToTelegramVideoIdHash;
};

const getVideoHash = (videoId: string, videoExtractor: string) => [videoId, videoExtractor]
    .join(VIDEO_ID_EXTRACTOR_NAME_DELIMITER);


export class VideoCacheHelper {
    public static instance: VideoCacheHelper;

    private readonly cacheFileAbsolutePath: string|null = null;

    static init(cacheFilePath: string) {
        this.instance = new VideoCacheHelper(cacheFilePath);
    }

    constructor(cacheFilePath: string) {
        if (!cacheFilePath) {
            return;
        }

        const cacheFileAbsolutePath = join(
            process.cwd(),
            cacheFilePath,
        );

        if (!existsSync(cacheFileAbsolutePath)) {
            openSync(cacheFileAbsolutePath, 'a')
            console.warn('Cache file path is set but file doesnt exist, creating', cacheFileAbsolutePath);

            return;
        }

        this.cacheFileAbsolutePath = cacheFileAbsolutePath;
    }

    private getVideoMap() {
        if (!this.cacheFileAbsolutePath) {
            return null;
        }

        const cacheStrings = readFileToLines(this.cacheFileAbsolutePath);
        return getMapFromStrings(cacheStrings);
    }

    getVideoIdFromCache(videoId: string, videoExtractor: string): string|null {
        const videoMap = this.getVideoMap();
        if (!videoMap) {
            return null;
        }
        const videoHash = getVideoHash(videoId, videoExtractor);
        return videoMap[videoHash] || null;
    }

    saveTelegramVideoIdToCache(videoId: string, videoExtractor: string, telegramVideoId: string) {
        if (!this.cacheFileAbsolutePath) {
            return;
        }

        const videoMap = this.getVideoMap() || {};

        const videoHash = getVideoHash(videoId, videoExtractor);
        videoMap[videoHash] = telegramVideoId;

        const cacheFileContent = Object.entries(videoMap)
            .map(entry => entry.join(RECORD_DELIMITER))
            .join('\n');

        try {
            writeFileSync(this.cacheFileAbsolutePath, cacheFileContent, 'utf8');
        } catch (err) {
            console.error('Error writing file:', err);
        }
    }
}
