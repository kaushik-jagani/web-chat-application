const express = require('express');
const path =require('path');
const http =require('http');
const socketio =require('socket.io');
const createAdapter = require("@socket.io/redis-adapter").createAdapter;
const redis = require("redis");
// require("dotenv").config();
const { createClient } = redis;
const formatMessage =require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
  } = require("./utils/users");

const app =express();
const server =http.createServer(app);
const io =socketio(server);


//set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName = 'justin';
//run when client connect
io.on('connection',socket => {
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id,username,room);

        socket.join(user.room);
        console.log(user);
        //user enter in cheat room
        socket.emit('message', formatMessage(botName, 'welcome to cheat web...'));

        //brodcast when user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} join the ${user.room}`));

         io.to(user.room).emit('roomUsers',{
            room : user.room,
            users : getRoomUsers(user.room)
         });
       
    });
    
    //listen for chat messages
    socket.on('chatMessage',msg =>{
        const user = getCurrentUser(socket.id);
       
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    //run when client disconnect
    socket.on('disconnect',()=>{
        const user =userLeave(socket.id);
        io.to(user.room).emit('message',formatMessage(botName,`${user.username}  left the chat rom` ));

        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the room`));
        }

        // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      }); 
    });
});


const port = 3000 || peocess.env.PORT; 

server.listen(port, () => console.log(`server running on port ${port}`));