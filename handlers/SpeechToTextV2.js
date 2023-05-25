import net from "net";

const waitingAudios = [];
export default class SpeechToTextV2 {
    constructor(EventManager, host, port) {
        this.EventManager = EventManager;
        this.client = net.connect(port, host);
        this.client.on("data", (data) => {
            data = JSON.parse(data.toString("utf-8"));
            console.log("User", data.transcript);
            this.EventManager.emit(data.id, data);
        });
    }
    async transcribe(path) {
        waitingAudios.push({ path });
        this.client.write(JSON.stringify({ path }));
    }
}
