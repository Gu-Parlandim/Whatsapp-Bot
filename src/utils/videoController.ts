import fs from "fs"
import { Whatsapp, Message } from "venom-bot"
import path from "path"
import {promisify } from "util"
import ffmpeg from "fluent-ffmpeg"
import mime from "mime-types"


export async function writeVideo (client:Whatsapp, message: Message) {

    const buffer = client.decryptFile(message)
    const filename = `${Date.now()}.${mime.extension(message.mimetype)}`
    const diretory = path.resolve('src', 'videos', `${filename}`)

    const writeFileAsync = promisify(fs.writeFile)

    fs.writeFile(diretory, await buffer, (err) => {
        console.log(err)
    });

    const res = await writeFileAsync(diretory, await buffer)

    return diretory
}

export async function createGifFile(diretory: string) : Promise<string> {
    const filename = `${Date.now()}.gif`
    const gifDiretory = path.resolve("src", "videos", filename)
    return new Promise((resolve, reject) => {
      ffmpeg(diretory)
        .setStartTime("00:00:00")
        //.setDuration("15")
        .size("512x512")
        .fps(5)
        .output(gifDiretory)
        .on("end", function (err) {
          if (!err) {
            resolve(gifDiretory);
          }
        })
        .on("error", function (err) {
          console.log("deu error");
          reject(err);
        })
        .run();
    });
}
