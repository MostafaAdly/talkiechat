import "dotenv/config";
import fetch from "node-fetch";

export default class SpeechToText {
    url = (id) =>
        `https://api.assemblyai.com/v2/transcript${id ? "/" + id : ""}`;
    params = (method, audio_url) => {
        let data = {
            headers: {
                authorization: process.env.ASSEMBLYAI_API_KEY,
                "content-type": "application/json",
            },
            method: method.toUpperCase(),
        };
        if (data.method != "GET") data.body = JSON.stringify({ audio_url });
        return data;
    };
    getText = async (audioLink) => {
        let response = null;
        let completed = response?.status == "completed";
        let counter = 0;
        while ((!response || response.status != "completed") && counter < 10) {
            response = await (
                await fetch(
                    this.url(response?.id),
                    this.params(response == null ? "post" : "get", audioLink)
                )
            ).json();
            completed = response?.status == "completed";
            console.log(`checking: [${response.status}]`);
            counter++;
            if (!completed) await this.wait(1500);
        }
        console.log("response", response.text);
        return response?.text;
    };
    wait(milleseconds) {
        return new Promise((resolve) => setTimeout(resolve, milleseconds));
    }
}
