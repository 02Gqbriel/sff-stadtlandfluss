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

const lobbies = {
    JKONCE: {
        rundenzahl: 2,
        rundenzeit: 2,
        anzKategorien: 2,
        kategorie_1: 'Land',
        kategorie_2: 'Fluss',
        timestamp: 1655887018229,
        players: [{ name: 'Besser', socket: null }],
        admin: {
            name: 'Peter',
            socket: null,
        },
    },
};
const lobbyIDs = ['JKONCE'];

// =========================================

// HTTP Requests

app.get('/', (req, res) => {
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
            const lobby = lobbies[req.query.lobbycode];

            playersHtml = '';
            lobby.players.forEach((el) => {
                playersHtml += '<tr><td>' + el + '</td></tr>';
            });

            data = { playerAmount: lobby.players.length, players: playersHtml };
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

    res.render(`${req.query['_']}`, {...data });
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
    const { status, data } = createLobby(req.body);

    res.status(status).send(data);
});

app.get('/api/list', async(req, res) => {
    res.json(lobbies);
});

app.get('/join', (req, res) => {
    const { username, lobbycode } = req.query;

    if (lobbycode == undefined) return res.sendStatus(404);

    const lobby = getLobby(lobbycode);

    if (lobby == null) return res.sendStatus(404);

    joinLobby(username, lobby);

    return res.json({ lobbycode, lobby });
});

// =========================================

// WEBSOCKET Connections

wsServer.on('connection', (socket) => {
    console.log('[WebSocket]> New Connection on ' + (socket.link || 'Not Accessable'));
    const { id } = initConnection(socket);

    socket.send(JSON.stringify({ code: 'init', data: { id } }));

    socket.on('message', (message) => {
        const res = JSON.parse(message.toString());

        if (res.code == 'init') {
            if (res.data.type == 'admin') {
                for (let connection of connections) {
                    if (res.data.id == connection.id) {
                        connection = {...connection, ...res.data };

                        lobbies[res.data.lobbycode].admin = {
                            name: res.data.username,
                            socket: connection.socket,
                        };
                    }
                }
            }

            if (res.data.type == 'player') {
                for (let connection of connections) {
                    if (res.data.id == connection.id) {
                        connection = {...connection, ...res.data };

                        for (let player of lobbies[res.data.lobbycode].players) {
                            if (player.name == res.data.username) player.socket = connection.socket;
                        }
                    }
                }
            }
        }
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
function joinLobby(username, lobby) {
    if (lobby.admin.socket != null) {
        lobby.players.push({ name: username, socket: null });

        console.log(lobby.admin.socket);

        lobby.admin.socket.send(JSON.stringify({ code: 'joined', data: { username } }));
    }
}

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

        lobbies[lobbycode].players = [];
        lobbies[lobbycode].admin = { name: null, socket: null };

        return { status: 200, data: { lobbycode } };
    } else {
        return { status: 404, data: null };
    }
}

function getLobby(lobbycode) {
    if (lobbies[lobbycode] == undefined) return null;

    return lobbies[lobbycode];
}

function initConnection(socket) {
    const data = { id: rndmstr.generate({ length: 12 }), socket };

    connections.push(data);

    return data;
}