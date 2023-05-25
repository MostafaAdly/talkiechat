// import SpeechToText from "./handlers/SpeechToText.js";
import SpeechToTextV2 from "./handlers/SpeechToTextV2.js";
import TextToSpeech from "./handlers/TextToSpeech.js";
import VoiceTranscriptor from "./handlers/VoiceTranscriptor.js";
import FileUploader from "./handlers/FileUploader.js";
import AudioPlayer from "./handlers/AudioPlayer.js";
import TalkieVoiceStatus from "./handlers/TalkieVoiceStatus.json" assert { type: "json" };
import AI from "./handlers/AI.js";
import fs from "fs";
import {
    joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
} from "@discordjs/voice";
import { Client, GatewayIntentBits } from "discord.js";
import EventEmitter from "events";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// ========================================= [Variables - Constants]
const prefix = "!";
const EventManager = new EventEmitter();
// const speech = new SpeechToText();
const ai = new AI();
const tts = new TextToSpeech(EventManager);
const player = new AudioPlayer(EventManager);
const uploader = new FileUploader(EventManager);
const speech = new SpeechToTextV2(EventManager, "localhost", 3000);
let discordAudioPlayer = createAudioPlayer();
EventManager.STATUS = TalkieVoiceStatus.IDLE;
// ========================================= [ --- General Events --- ]

EventManager.on("file-saved", async (connection, data) => {
    console.log("file-saved");
    try {
        // START VERSION 2 HERE
        EventManager.on(data.mp3path, async (info) => {
            // Receive transcription
            try {
                let AIResponse = await ai.getAIResponse(false, info.transcript);
                if (!AIResponse)
                    EventManager.emit(
                        "talkie_error",
                        "AI_RESPONSE_GENERATING",
                        connection,
                        true
                    );

                console.log("AI", AIResponse);
                // Generating AI Voice
                EventManager.on(
                    `mp3_${data.filename}.mp3`,
                    (connection, mp3) => {
                        setTimeout(
                            () =>
                                player.playAudio(
                                    null,
                                    connection,
                                    `./ai_responses/${data.filename}.mp3`
                                ),
                            300
                        );
                        EventManager.removeAllListeners(
                            `mp3_${data.filename}.mp3`
                        );
                    }
                );

                try {
                    await tts.save(
                        connection,
                        AIResponse,
                        data.filename + ".mp3"
                    );
                } catch (error) {
                    EventManager.emit(
                        "talkie_error",
                        "AI_VOICE_GENERATING",
                        connection,
                        true
                    );
                }
                // Play .mp3 file Generated [./ai_responses/{filename}.mp3]
            } catch (error) {
                playErrorAudioFile(connection);
            }
            EventManager.removeAllListeners(data.mp3path);
        });
        speech.transcribe(data.mp3path);
    } catch (error) {
        EventManager.emit("talkie_error", "HANDLING", connection, true);
    }
});

EventManager.on("talkie_error", (type, connection, shouldPlay) => {
    console.log(`[ERROR_HANDLER] Error at: ${type}`);
    if (shouldPlay) playErrorAudioFile(connection);
    else EventManager.STATUS = TalkieVoiceStatus.IDLE;
});

// ========================================= [ -- Discord Events -- ]
client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.content.startsWith(prefix)) return;
    let _args = msg.content.split(/ +/g);
    let args = _args.slice(1);
    let cmd = _args[0].slice(prefix.length);
    if (cmd == "start") {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel)
            return msg.reply({ content: "Please join a voice channel first." });
        const connection = fixConnectionIssue(
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
            })
        );

        await new VoiceTranscriptor(EventManager).startListening(
            msg,
            client,
            connection
        );
    }
});

const fixConnectionIssue = (connection) => {
    connection.on("stateChange", (oldState, newState) => {
        const oldNetworking = Reflect.get(oldState, "networking");
        const newNetworking = Reflect.get(newState, "networking");

        const networkStateChangeHandler = (
            oldNetworkState,
            newNetworkState
        ) => {
            const newUdp = Reflect.get(newNetworkState, "udp");
            clearInterval(newUdp?.keepAliveInterval);
        };
        oldNetworking?.off("stateChange", networkStateChangeHandler);
        newNetworking?.on("stateChange", networkStateChangeHandler);
    });
    return connection;
};

const playErrorAudioFile = (connection) => {
    player.playAudio(null, connection, TalkieVoiceStatus.ERROR);
};

await client.login(process.env.DISCORD_TOKEN);
