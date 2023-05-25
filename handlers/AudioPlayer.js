import {
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} from "@discordjs/voice";
import fs from "fs";
import TalkieVoiceStatus from "./TalkieVoiceStatus.json" assert { type: "json" };

export default class AudioPlayer {
    constructor(EventEmitter) {
        this.EventEmitter = EventEmitter;
    }
    playAudio(player, connection, filepath) {
        if (!player) player = createAudioPlayer();
        const resource = createAudioResource(filepath, { inlineVolume: true });
        if (!resource) return;
        // console.log(fs.readFileSync(filepath));
        // console.log(filepath);
        player.play(resource);
        connection.subscribe(player);
        function doAll(EventEmitter) {
            try {
                if (!filepath.includes("error")) fs.unlinkSync(filepath);
            } catch (error) {}
            EventEmitter.STATUS = TalkieVoiceStatus.IDLE;
            player.removeAllListeners();
            player.unsubscribe();
            player.stop();
            player = null;
        }
        player.on("idle", () => doAll(this.EventEmitter));
        player.on("error", () => doAll(this.EventEmitter));
    }
}
