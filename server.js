"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socket_io_1 = require("socket.io");
require('dotenv').config();
const nodemailer = require("nodemailer");
const ADMIN = "Admin";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var mailOptions = {
        from: 'ghiasikhamene@outlook.com',
        to: 'ghiasikhamene@gmail.com',
        subject: "some",
        text: "some"
    };
}));
const expressServer = app.listen(80, () => {
    console.log("server up ");
});
let UserState = {
    users: [],
    setUsers: function (newArrayUsers) {
        if (newArrayUsers) {
            this.users = newArrayUsers;
        }
    },
};
const io = new socket_io_1.Server(expressServer, {
    cors: {
        origin: ["http://localhost:3000", "https://personal-websit-eosin.vercel.app", "https://aghiasi.onrender.com"]
    }
});
io.on("connection", (socket) => {
    //only to user connected
    socket.emit("message", buildMsg(ADMIN, "wellcome to chat app"));
    socket.on("enterRoom", ({ name, room }) => {
        var _a;
        const pervRoom = (_a = getUser(socket.id)) === null || _a === void 0 ? void 0 : _a.room;
        if (pervRoom) {
            socket.leave(pervRoom);
            io.to(pervRoom).emit("message", buildMsg(ADMIN, `${name} has left the room`));
        }
        const user = activiteUser(socket.id, name, room);
        const some = getUser(socket.id);
        if (pervRoom) {
            io.to(pervRoom).emit("userList", {
                users: getUsersInRoom(pervRoom)
            });
        }
        if (some) {
            socket.join(some.room);
            socket.emit("message", buildMsg(ADMIN, `you have joined the ${some.room} chat room`));
            socket.broadcast.to(some.room).emit("message", buildMsg(ADMIN, `${some.name} joined the room `));
            io.to(some.room).emit("userList", {
                users: getUsersInRoom(some.room)
            });
            io.emit("roomList", {
                rooms: getAllActiveRooms()
            });
        }
    });
    socket.on("disconnect", () => {
        const user = getUser(socket.id);
        userLeaveApp(socket.id);
        if (user) {
            io.to(user.room).emit("message", buildMsg(ADMIN, `${user.name} leaved the room `));
            io.to(user.room).emit("userList", {
                users: getUsersInRoom(user.room)
            });
            io.emit("roomList", {
                rooms: getAllActiveRooms()
            });
        }
    });
    socket.on("roomList", () => {
        io.emit("roomList", {
            rooms: getAllActiveRooms()
        });
    });
    socket.on("message", ({ name, text }) => {
        var _a;
        const room = (_a = getUser(socket.id)) === null || _a === void 0 ? void 0 : _a.room;
        if (room) {
            io.to(room).emit("message", buildMsg(name, text));
            io.emit("toAdmin", buildMsg(name, text));
        }
    });
    socket.on("activity", (name) => {
        var _a;
        const room = (_a = getUser(socket.id)) === null || _a === void 0 ? void 0 : _a.room;
        if (room) {
            socket.broadcast.to(room).emit("activity", name);
        }
    });
});
const buildMsg = (name, text) => {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
        }).format(new Date()),
    };
};
const activiteUser = (id, name, room) => {
    const user = { id, name, room };
    const filtering = UserState.users.filter((user) => user.id !== id);
    UserState.setUsers([...filtering, user]);
};
const userLeaveApp = (id) => {
    UserState.setUsers(UserState.users.filter((user) => user.id !== id));
};
const getUser = (id) => {
    return UserState.users.find((user) => user.id === id);
};
const getUsersInRoom = (room) => {
    return UserState.users.filter((users) => users.room === room);
};
const getAllActiveRooms = () => {
    return Array.from(new Set(UserState.users.map((user) => user.room)));
};
