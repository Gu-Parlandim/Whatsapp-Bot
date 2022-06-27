import fs from "fs"
// @ts-ignore
import YouTube  from "simple-youtube-api"
import ytdl from 'ytdl-core' //with --esModuleInterop
import path from 'path'
import youtubeApi from "../config/youtubeApi"


const token = youtubeApi.token;


const youtube = new YouTube(token);

function writeVideo (id:string): Promise<string> {

    const pathFile = path.resolve('src', 'videos', `${id}.mp4`)
    const audioStream = fs.createWriteStream(pathFile)
  
    return new Promise((resolve, reject) => {
      ytdl(id, {quality: 18})
        .pipe(audioStream)
        .on('error', error => reject(error))
        .on('finish', () => resolve(pathFile))
    })
  }

export const getYoutubeVideo = async (musicName: string):Promise<[string, string] | undefined> => {
    try{    
        const searchVideos = await youtube.searchVideos(musicName, 1)
        const {id, title} = searchVideos[0]

        const diretory = await writeVideo(id)
        return [diretory, title]
    }
    catch(error){
        console.error("deu error aqui: ", error)
    }
} 