const express = require('express');
const ws = require('ws');

const app = express();

//database

const connections = {};

const lobbies = {};

// -------

app.get('/', (req, res) => {
    res.redirect('/page?name=login');
});

app.get('/page', (req, res) => {
    switch (req.query.name) {
        case 'login':
            res.send('login');
            break;
        default:
            res.status(404).send('Error page: ' + req.query.name + ' Not Found!');
    }
});

app.get('/script', (req, res) => {
    switch (req.query.name) {
        case 'login':
            res.send('login');
            break;
        default:
            res.send('Error script: ' + req.query.name + ' Not Found!');
    }
});

app.get('/style', (req, res) => {
    switch (req.query.name) {
        case 'login':
            res.send('login');
            break;
        default:
            res.status(404).send('Error style: ' + req.query.name + ' Not Found!');
    }
});

const wsServer = new ws.Server({ noServer: true });

wsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
        const data = JSON.parse(message.toString());
        console.log(data);
    });
});

wsServer.on('error', (error) => {
    console.log(error);
});

const server = app.listen(3000);

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
        wsServer.emit('connection', socket, request);
    });
});