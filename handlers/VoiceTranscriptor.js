import {
    VoiceConnectionStatus,
    entersState,
    joinVoiceChannel,
    EndBehaviorType,
} from "@discordjs/voice";
import TalkieVoiceStatus from "./TalkieVoiceStatus.json" assert { type: "json" };
import OpusEncoder from "@discordjs/opus";
import fs from "fs";
import { createWriteStream } from "node:fs";
import prism from "prism-media";
import { pipeline } from "node:stream";
import ffmpeg from "ffmpeg";

export default class VoiceTranscriptor {
    constructor(EventManager) {
        this.EventManager = EventManager;
    }
    async startListening(message, client, connection) {
        this.connection = connection;
        await entersState(connection, VoiceConnectionStatus.Ready, 20e4);
        const receiver = connection.receiver;
        receiver.speaking.on("start", (userId) => {
            // if (userId !== message.author.id) return;
            if (this.EventManager.STATUS == TalkieVoiceStatus.IDLE)
                this.createListeningStream(
                    receiver,
                    userId,
                    client.users.cache.get(userId)
                );
        });
    }
    createListeningStream(receiver, userId, user) {
        const opusStream = receiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 3000,
            },
        });

        const oggStream = new prism.opus.OggLogicalBitstream({
            opusHead: new prism.opus.OpusHead({
                channelCount: 2,
                sampleRate: 48000,
            }),
            pageSizeControl: {
                maxPackets: 74,
            },
        });
        const data = {
            filename: `${user.id}-${Date.now()}`,
            pmcpath: `./recordings/${user.id}-${Date.now()}.pmc`,
            mp3path: `./recordings/${user.id}-${Date.now()}.mp3`,
        };
        const out = createWriteStream(data.pmcpath, { flags: "a" });
        pipeline(opusStream, oggStream, out, (err) => {
            if (!err) this.pcmToMp3File(data);
        });
        // });
    }
    pcmToMp3File(data) {
        const process = new ffmpeg(data.pmcpath);
        process.then(
            (audio) => {
                audio.fnExtractSoundToMP3(data.mp3path, async (error, file) => {
                    if (error) return console.log(error);
                    fs.unlinkSync(data.pmcpath);
                    this.EventManager.emit("file-saved", this.connection, data);
                });
            },
            (err) => {
                /* handle error by sending error message to discord */
                return console.log(
                    `❌ An error occurred while processing your recording: ${err.message}`
                );
            }
        );
    }
}
