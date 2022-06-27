const Genius = require("genius-lyrics")

export async function getSongLyrics(songName:string): Promise<string> {
    try {
        const Client = new Genius.Client();
        const searches = await Client.songs.search(songName);
        const firstSong = searches[0];
    
        const lyrics = await firstSong.lyrics();
       
        return lyrics
    }
    catch(err){
        console.log("error: ", err)
        return "Ocorreu um error ao enviar"
    }
   
}