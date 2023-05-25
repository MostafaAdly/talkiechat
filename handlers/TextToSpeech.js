import texttoSpeech from "elevenlabs-api";
const voiceId = "21m00Tcm4TlvDq8ikWAM";
export default class TextToSpeech {
    constructor(EventEmitter) {
        this.EventEmitter = EventEmitter;
    }
    async save(connection, text, filename = "last-output.mp3") {
        const data = {
            filename,
            extention: ".mp3",
            path: "./ai_responses/" + filename,
        };
        await texttoSpeech(
            process.env.ELEVENLABS_API_KEY,
            text,
            voiceId,
            data.path
        );
        this.EventEmitter.emit(`mp3_${filename}`, connection, data);
    }
}
