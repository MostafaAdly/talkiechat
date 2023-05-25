import socket
import threading
import openai
import json
openai.api_key = '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'


HOST = '127.0.0.1'
PORT = 3000

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind((HOST, PORT))

server.listen()

clients = []
nickname = []
def detectInput():
    input('Exit?\n')
    print('exiting')
    server.close()

thread0 = threading.Thread(target=detectInput, args=())
thread0.start()
def broadcast(message):
    for client in clients:
        client.send(message)

def handle(client, address):
    while True:
        try:
            string = str(client.recv(1024).decode('utf-8'))
            message = json.loads(string)
            print(f"Client {str(address)} LOADED")
            try:
                audio_file = open(message['path'], 'rb')
                transcript = openai.Audio.transcribe("whisper-1", audio_file)
                try:
                    data = {
                        "id": message['path'],
                        "transcript": transcript['text']
                    }
                    client.send(json.dumps(data).encode('utf-8'))
                except:
                    print(f'Failed to send data to client [{client.address}]')
            except:
                print(f'Failed to transcribe the path-url[{message}]')
                pass
        except:
            if client in clients:
                clients.remove(client)
            print(f"Client {address} disconnected")
            try:
                client.close()
            except:
                break
            break

def receive():
    while True:
        client, address = server.accept()
        clients.append(client)
        thread = threading.Thread(target=handle, args=(client, address))
        thread.start()

print("Server running...")

receive()