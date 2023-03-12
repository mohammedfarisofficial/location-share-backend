import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { createServer } from "http";
//models
import User from "./models/User.js";

const app = express();
const PORT = 4000;
const httpServer = createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL },
   methods: ["GET", "POST"]
});

// socket connection
io.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  socket.on("disconnect", () => {
    console.log("🔥: A user disconnected");
  });

  //updatings
  socket.on("position", async (position) => {
    const { name, lat, lng } = position.data;
    const updatedUser = await User.findOneAndUpdate(
      { name },
      {
        latitude: lat,
        longitude: lng,
      }
    );
    // const response = await updatedUser.save();
    console.log(updatedUser);
    socket.broadcast.emit("otherPositions", updatedUser.toJSON());
  });
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  res.json({
    users,
  });
});

mongoose.set("strictQuery", true);
mongoose
  .connect(
    process.env.MONGO_URL || {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    httpServer.listen(PORT, () => console.log(`server port ${PORT}`));
  })
  .catch((err) => console.log(`${err} did not connect`));
