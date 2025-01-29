"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const socket_io_1 = require("socket.io");
const ADMIN = "Admin";
const app = express();
const expressServer = app.listen(3000, () => {
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
const io = new socket_io_1.Server(expressServer);
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
    socket.on("message", ({ name, text }) => {
        var _a;
        const room = (_a = getUser(socket.id)) === null || _a === void 0 ? void 0 : _a.room;
        if (room) {
            io.to(room).emit("message", buildMsg(name, text));
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
