const express = require('express'),
    ws = require('ws'),
    path = require('path'),
    sprightly = require('sprightly'),
    rndmstr = require('randomstring');

const app = express(),
    wsServer = new ws.Server({ noServer: true });

app.engine('spy', sprightly);
app.set('view engine', 'spy');
app.use(express.json());

// DATABASE

const connections = [];

const lobbies = {};
const lobbyIDs = [];

// =========================================

// HTTP Requests

app.get('/', (req, res) => {
    console.log(req.originalUrl);
    res.redirect('/page?_=login');
});

app.get('/page', (req, res) => {
    let data = null;
    switch (req.query['_']) {
        case 'login':
            data = { name: 'hello' };
            break;
        case 'create':
            break;
        case 'lobby':
            break;
        case 'answer':
            break;
        case 'score':
            break;
        case 'admin':
            break;
        case 'podium':
            break;
    }

    res.render(`${req.query['_']}`, data);
});

app.get('/script', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'script.js'));
});

app.get('/style', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'style.css'));
});

app.get('/favicon.png', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'favicon.ico'));
});

app.post('/create', async(req, res) => {
    const data = req.body;
    console.log(data);

    res.sendStatus(createLobby(data));
});

app.get('/api/list', async(req, res) => {
    res.json(lobbies);
});

app.get('/join', (req, res) => {
    const { username, lobbycode } = req.query;

    if (lobbycode == undefined) return res.sendStatus(404);

    const lobby = getLobby(lobbycode);

    if (lobby == null) return res.sendStatus(404);

    joinLobby(username, lobbycode);

    return res.json(lobby);
});

// =========================================

// WEBSOCKET Connections

wsServer.on('connection', (socket) => {
    console.log('[WebSocket]> New Connection on ' + socket.url);
    const { id } = initConnection(socket);

    socket.send({ code: 'init', data: { id } });

    socket.on('message', (message) => {
        const data = JSON.parse(message.toString());
        console.log(data);
    });
});

wsServer.on('error', (error) => {
    console.log('[WEBSOCKET]> ', error);
});

wsServer.on('close', () => {
    console.log('[WEBSOCKET]> ', this);
});

// =========================================

const server = app.listen(3002, (err) => {
    if (err) return console.log('[HTTP]> ', err);
    console.log('[HTTP]> Server listening on http://localhost:3002');
});

server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket) => {
        wsServer.emit('connection', socket, request);
    });
});

// =========================================

// Utitlity Function
function joinLobby(username, lobbycode) {}

function createLobby(data) {
    const lobbycode = rndmstr.generate({ capitalization: 'uppercase', length: 6 });

    for (let i = 0; i < lobbyIDs.length; i++) {
        if (Date.now() - lobbies[lobbyIDs[i]].timestamp >= 360000) {
            lobbies[lobbyIDs[i]] = undefined;
        }
    }

    if (lobbies[lobbycode] == undefined) {
        lobbies[lobbycode] = {};
        data.forEach((el) => {
            lobbies[lobbycode][el.id] = el.val;
        });

        lobbies[lobbycode].timestamp = Date.now();
        lobbyIDs.push(lobbycode);

        lobbies[lobbycode].admin;

        return 200;
    } else {
        return 404;
    }
}

function getLobby(lobbycode) {
    if (lobbies[lobbycode] == undefined) return null;

    return lobbies[lobbycode];
}

function initConnection(socket) {
    const data = { id: rndmstr.generate({ length: 12 }), socket };

    connections.push(data);

    return id;
}