declare global {
    namespace NodeJS {
        interface ProcessEnv{
            MONGO_CONNECTION: string, 
            YOUTUBE_API_TOKEN: string,
        }
    }
}

export {}