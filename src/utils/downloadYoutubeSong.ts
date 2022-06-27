import path from "path"
// @ts-ignore
import YouTube  from "simple-youtube-api"
import ytdl from 'ytdl-core'
import ffmpeg from "fluent-ffmpeg"
import youtubeApi from "../config/youtubeApi"


const token = youtubeApi.token;
const youtube = new YouTube(token);

function writeMp3 (id:string): Promise<string> {
    const pathFile = path.resolve('src', 'audio', `${id}.mp3`)

    let stream = ytdl(id, {
        quality: 'highestaudio',
      })
  
    return new Promise((resolve, reject) => {
        ffmpeg(stream)
        .audioBitrate(128)
        .save(pathFile)
        .on("error", (err) => { 
            console.log("deu error: ", err)
            reject(err) 
        })
        .on('end', (err) => {
            resolve(pathFile)
        })  
    })
}

export const getAudio = async (musicName: string):Promise<[string, string] | undefined> => {
    try{    
        const searchVideos = await youtube.searchVideos(musicName, 1)
        const {id, title} = searchVideos[0]

        const diretory = await writeMp3(id)
        return [diretory, title]
    }
    catch(error){
        console.error(error)
    }
}