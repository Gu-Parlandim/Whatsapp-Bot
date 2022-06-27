import fs from "fs"
import { Whatsapp, Message } from "venom-bot"
import path from "path"
import {promisify } from "util"
import mime from "mime-types"

export async function writeImage (client:Whatsapp, message: Message) {

    const buffer = client.decryptFile(message)
    const filename = `${Date.now()}.${mime.extension(message.mimetype)}`
    const diretory = path.resolve('src', 'images', `${filename}`)

    const writeFileAsync = promisify(fs.writeFile)

    fs.writeFile(diretory, await buffer, (err) => {
        console.log(err)
    });

    const res = await writeFileAsync(diretory, await buffer)

    return diretory
 }



  
  


 