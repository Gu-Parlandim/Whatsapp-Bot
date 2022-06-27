import {create, Whatsapp, Message} from "venom-bot"
import {writeImage} from "./utils/imageController"
import { writeVideo, createGifFile } from "./utils/videoController"
import mime from "mime-types"
import axios from "axios"
import deleteFile from "./utils/deleteFile"
import { getYoutubeVideo } from "./utils/downloadYoutubeVideo"
import { getAudio as youtubeAudio } from "./utils/downloadYoutubeSong"
import { getSongLyrics } from "./utils/getLyrics"


class Sender {
    private client!: Whatsapp

    constructor(){
        this.initialize()
    }

    private async sendText(to: string, message: string){
       await this.client.sendText(to, message)
       .catch(err => console.log("error: ", err))
    }

    private async sendMusic(from: string, content: string){
        const musicName = content.replace("!music", "")
        if(!musicName) return await this.sendText(from, "*O nome não pode ser vazio!*")

        await this.sendText(from, "Aguarde...")
        await this.client.startTyping(from)

        const [diretory, title] = await youtubeAudio(musicName)
        
        await this.client.sendFile(from, diretory)
            .then((result) => {
                this.sendText(from, title)
                deleteFile(diretory)
            })
            .catch((error) => {
                console.error("deu error:", error)
                this.sendText(from, "ocorreu um error ao enviar")
                deleteFile(diretory)
            })
    }

    private async sendSongLyrics(from: string, content: string){
        const musicName = content.replace("!lyrics", "")

        if(!musicName) return await this.sendText(from, "*O nome não pode ser vazio!*")

        const lyrics = await getSongLyrics(musicName)

        await this.sendText(from, lyrics)
    }

    private async sendFileExemple(from: string, content: string){
        const videoName = content.replace("!test", "")
        
        const [diretory, title] = await getYoutubeVideo(videoName)
        
        await this.client.sendFile(from, diretory)
            .then((result) => {
                console.log('Result: ', result)
            })
            .catch((erro) => {
            console.error('Error when sending: ', erro)
            }) 
    }

    private async createAndSendSticker(from: string, message: Message) {
        const diretory = await writeImage(this.client, message)
        await this.client.startTyping(from)

        await this.client.sendImageAsSticker(from, diretory)
            .then((result) => {
                deleteFile(diretory)
            })
            .catch((err) => {
                console.log(err)
                this.sendText(from, "Error ao criar figurinha")
                deleteFile(diretory)
            });
    }

    private async createAndSendVideoSticker(from: string, message: Message) {
        await this.sendText(from, "Isso Pode levar um longo tempo...")
        await this.client.startTyping(from)

        const videoDiretory = await writeVideo(this.client, message)
        const gifDiretory = await createGifFile(videoDiretory)
        
        await this.client.sendImageAsStickerGif(from, gifDiretory)
            .then(async (result) => {
                deleteFile(videoDiretory)
                deleteFile(gifDiretory)
            })
            .catch(async(erro) => {
                console.error('Error: ', erro)
                this.sendText(from, "Ocorreu um error ao criar figuria \nTamanho maximo de figurinha: 1MB")
                deleteFile(videoDiretory)
                deleteFile(gifDiretory)
            });
    }

    private async sendDogImage(from: string){
        const response = await axios.get('https://dog.ceo/api/breeds/image/random')
        const {message} = response.data

        await this.client.sendImage(from, message, message, "doginho")
            .then((result) => {
                
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); 
            })
    }

    private async sendCatImage(from: string){

        await this.client.sendImage(from, "https://cataas.com/cat", "cat-image.jpg", "gatinho")
            .then((result) => {
                //console.log('Result: ', result); 
            })
            .catch((erro) => {
                console.error('Error when sending: ', erro); 
            })
    }

    private async sendCommandsMessage(from: string){
        const text = "*Comandos:* \n\n*!music* e o nome da música para baixa-la \n\n*!sticker* envie uma imagem, gif ou video com a legenda !sticker para criar uma figurinha \n\n*!puzze* para uma piada (de tiozão) \n\n*!dog* experimente esse \n\n*!cat* você também pode gostar desse"
        this.sendText(from, text )
    }

    private async sendWelcomeMessage(from: string){
        this.sendText(from, `*Bem vindo ao ParlanBot!* \n\nEnvie *!comandos* para visualizar a lista de comandos`)
    }

    private async sendPuzzeMessage(from: string){
        await this.sendText(from, "Isso pode levar um tempo...")
        await this.client.startTyping(from)

        const response = await axios.get("https://api-charadas.herokuapp.com/puzzle?lang=ptbr")
        const {question, answer} = response.data

        this.sendText(from, `*Pergunta:* ${question} \n\n*Resposta:* ${answer}`)
    }

    private async selectMessageToSend(command: string ,message: Message){
        const {from, content} = message
        const selectCommand = {
            "!music": async() => await this.sendMusic(from, content),
            "!comandos": async() => await this.sendCommandsMessage(from),
            "!puzze": async() => await this.sendPuzzeMessage(from),
            "!dog": async() => await this.sendDogImage(from),
            "!cat": async() => await this.sendCatImage(from),
            "!test":async () => await this.sendFileExemple(from, content),
            "!lyrics": async () => await this.sendSongLyrics(from, content)
        }
        // @ts-ignore
        return selectCommand[command]?.() || this.sendText(
            from, 
            "Envie *!comandos* para visualizar a lista de comandos")
    }

    private async selectStickerToSend(mimeType: string | false ,message: Message){
        const {from} = message
        const selectCommand = {
            "jpeg": async() => await this.createAndSendSticker(from, message),
            "mp4": async () => await this.createAndSendVideoSticker(from, message)
        }
        // @ts-ignore
        return selectCommand[mimeType]?.() || this.sendText(from, "Tipo de arquivo invalido!")
    }

    private initialize(){

        const startBot = (client: Whatsapp) => {
            this.client = client

            this.client.onMessage(async (message) => {
                const {from, content} = message
                try{
                    if(!content) return  this.sendWelcomeMessage(from)

                    if (message.isMedia === true || message.isMMS === true) {
                        if(message.caption.startsWith("!sticker")){
                            const mimeType = (mime.extension(message.mimetype))
                            this.selectStickerToSend(mimeType, message)
                        }
                    } 
                    else {
                        const [command] = content.split(" ")
                        this.selectMessageToSend(command, message)
                    }
                }
                catch(error){
                    console.error(error)
                }
            })
        }

        create({
            session: 'whatsappbot',
            multidevice: true,
        })
          .then((client) => startBot(client))
          .catch((erro) => {console.log(erro)})
    }
}

export default Sender