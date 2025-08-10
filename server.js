"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var socket_io_1 = require("socket.io");
require("dotenv").config();
var nodemailer = require("nodemailer");
var ADMIN = "Admin";
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var expressServer = app.listen(80, function () {
    console.log("server up ");
});
var UserState = {
    users: [],
    setUsers: function (newArrayUsers) {
        if (newArrayUsers) {
            this.users = newArrayUsers;
        }
    },
};
var io = new socket_io_1.Server(expressServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "https://personal-websit-eosin.vercel.app",
            "https://aghiasi.onrender.com",
            "https://aghiasi.vercel.app",
        ],
    },
});
io.on("connection", function (socket) {
    //only to user connected
    socket.emit("message", buildMsg(ADMIN, "wellcome to chat app"));
    socket.on("enterRoom", function (_a) {
        var _b;
        var name = _a.name, room = _a.room;
        var pervRoom = (_b = getUser(socket.id)) === null || _b === void 0 ? void 0 : _b.room;
        if (pervRoom) {
            socket.leave(pervRoom);
            io.to(pervRoom).emit("message", buildMsg(ADMIN, "".concat(name, " has left the room")));
        }
        var user = activiteUser(socket.id, name, room);
        var some = getUser(socket.id);
        if (pervRoom) {
            io.to(pervRoom).emit("userList", {
                users: getUsersInRoom(pervRoom),
            });
        }
        if (some) {
            socket.join(some.room);
            socket.emit("message", buildMsg(ADMIN, "you have joined the ".concat(some.room, " chat room")));
            socket.broadcast
                .to(some.room)
                .emit("message", buildMsg(ADMIN, "".concat(some.name, " joined the room ")));
            io.to(some.room).emit("userList", {
                users: getUsersInRoom(some.room),
            });
            io.emit("roomList", {
                rooms: getAllActiveRooms(),
            });
        }
    });
    socket.on("disconnect", function () {
        var user = getUser(socket.id);
        userLeaveApp(socket.id);
        if (user) {
            io.to(user.room).emit("message", buildMsg(ADMIN, "".concat(user.name, " leaved the room ")));
            io.to(user.room).emit("userList", {
                users: getUsersInRoom(user.room),
            });
            io.emit("roomList", {
                rooms: getAllActiveRooms(),
            });
        }
    });
    socket.on("roomList", function () {
        io.emit("roomList", {
            rooms: getAllActiveRooms(),
        });
    });
    socket.on("message", function (_a) {
        var _b;
        var name = _a.name, text = _a.text;
        var room = (_b = getUser(socket.id)) === null || _b === void 0 ? void 0 : _b.room;
        if (room) {
            io.to(room).emit("message", buildMsg(name, text));
            io.emit("toAdmin", buildMsg(name + " " + room, text));
        }
    });
    socket.on("activity", function (name) {
        var _a;
        var room = (_a = getUser(socket.id)) === null || _a === void 0 ? void 0 : _a.room;
        if (room) {
            socket.broadcast.to(room).emit("activity", name);
        }
    });
});
var buildMsg = function (name, text) {
    return {
        name: name,
        text: text,
        time: new Intl.DateTimeFormat("default", {
            hour: "numeric",
            minute: "numeric",
        }).format(new Date()),
    };
};
var activiteUser = function (id, name, room) {
    var user = { id: id, name: name, room: room };
    var filtering = UserState.users.filter(function (user) { return user.id !== id; });
    UserState.setUsers(__spreadArray(__spreadArray([], filtering, true), [user], false));
};
var userLeaveApp = function (id) {
    UserState.setUsers(UserState.users.filter(function (user) { return user.id !== id; }));
};
var getUser = function (id) {
    return UserState.users.find(function (user) { return user.id === id; });
};
var getUsersInRoom = function (room) {
    return UserState.users.filter(function (users) { return users.room === room; });
};
var getAllActiveRooms = function () {
    return Array.from(new Set(UserState.users.map(function (user) { return user.room; })));
};
