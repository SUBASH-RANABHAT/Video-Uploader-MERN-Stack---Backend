//require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./database/connectdb.js"
import { app } from "./app.js"

dotenv.config({
    path: './env'
})

connectDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running at port ${process.env.PORT }`);
  })
})
.catch((error) => {console.log("Error: ", error);})


















/*
import express from "express"
const app = express()
(async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      app.on("error", () => {
        console.log("ERROR: Express cant detect DB", error);
        throw error
      })

      app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`);
      })

    } catch (error) {
        console.log("ERROR: ", error);
        throw error
    }
})();
*/