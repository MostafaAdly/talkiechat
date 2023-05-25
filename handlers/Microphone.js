import NodeMic from "node-mic";
import fs from "fs";
// @docs: https://github.com/Symbitic/node-mic

export default class Microphone {
    constructor() {
        this.mic = new NodeMic({
            rate: 44100,
            channels: 1,
            threshold: 6,
        });

        const micInputStream = this.mic.getAudioStream();
        const outputFileStream = fs.createWriteStream("./last-output.mp3");

        micInputStream.pipe(outputFileStream);

        micInputStream.on("error", (err) => {
            console.log(`Error: ${err.message}`);
        });

        micInputStream.on("started", () => {
            console.log("Started");
            setTimeout(() => {
                this.mic.stop();
            }, 5000);
        });

        micInputStream.on("stopped", () => {
            console.log("Stopped");
        });
        micInputStream.on("silence", () => {
            this.mic.stop();
        });

        micInputStream.on("exit", (code) => {});
    }
    async start() {
        this.mic.start();
    }
}
