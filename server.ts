const express = require("express");
import { Server } from "socket.io";
const cros = require("cros")
const ADMIN = "Admin";
const app = express();
const expressServer = app.listen(3000, () => {
  console.log("server up ");
});
let UserState: State = {
  users: [],
  setUsers: function (newArrayUsers: ArrayUser) {
    if (newArrayUsers) {
      this.users = newArrayUsers;
    }
  },
};
expressServer.use(cros)
const io = new Server(expressServer);
io.on("connection", (socket: any) => {
  //only to user connected
  socket.emit("message",buildMsg(ADMIN,"wellcome to chat app"));

  socket.on("enterRoom",({name,room}:{name:string,room:string})=>{
    const pervRoom = getUser(socket.id)?.room
    if(pervRoom){
      socket.leave(pervRoom)
      io.to(pervRoom).emit("message",buildMsg(ADMIN,`${name} has left the room`))
    }
    const user = activiteUser(socket.id,name, room)
    const some = getUser(socket.id)
    if(pervRoom){
      io.to(pervRoom).emit("userList",{
        users:getUsersInRoom(pervRoom)
      })
    }
    if(some){
    socket.join(some.room)
    socket.emit("message",buildMsg(ADMIN,`you have joined the ${some.room} chat room`))
    socket.broadcast.to(some.room).emit("message",buildMsg(ADMIN,`${some.name} joined the room `))
    io.to(some.room).emit("userList",{
      users:getUsersInRoom(some.room)
    })
    io.emit("roomList",{
      rooms:getAllActiveRooms()
    })
    }
  })
  socket.on("disconnect", () => {
    const user = getUser(socket.id)
    userLeaveApp(socket.id)
    if(user){
    io.to(user.room).emit("message",buildMsg(ADMIN,`${user.name} leaved the room `))
    io.to(user.room).emit("userList",{
      users:getUsersInRoom(user.room)
    })
    io.emit("roomList",{
      rooms:getAllActiveRooms()
    })
    }
  });
  socket.on("message", ({name,text}:{name:string,text:string}) => {
    const room = getUser(socket.id)?.room
    if(room){
      io.to(room).emit("message",buildMsg(name,text))
    }
  });
  socket.on("activity", (name: string) => {
    const room = getUser(socket.id)?.room
    if(room){
      socket.broadcast.to(room).emit("activity",name)
    }
  });
});
interface User {
  id: string;
  name: string;
  room: string;
}
interface ArrayUser extends Array<User> {}
type State = {
  users: ArrayUser;
  setUsers: Function;
};
const buildMsg = (name: string, text: string) => {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("default", {
      hour: "numeric",
      minute: "numeric",
    }).format(new Date()),
  };
};
const activiteUser = (id: string, name: string, room: string) => {
  const user = { id, name, room };
  const filtering = UserState.users.filter((user: User) => user.id !== id);
  UserState.setUsers([...filtering, user]);
};
const userLeaveApp = (id: string) => {
  UserState.setUsers(UserState.users.filter((user: User) => user.id !== id));
};
const getUser =(id:string):User | undefined =>{
  return UserState.users.find((user:User)=>user.id === id)
}
const getUsersInRoom = (room:string)=>{
  return UserState.users.filter((users:User)=>users.room === room )
}
const getAllActiveRooms = ()=>{
  return Array.from(new Set(UserState.users.map((user:User)=>user.room)))
}