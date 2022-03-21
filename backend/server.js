let i = 0;

setInterval(() => {
    console.log('Backend --> ping: ' + i);
    i++;
}, 2000 * Math.random());