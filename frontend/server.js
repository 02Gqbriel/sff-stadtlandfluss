let i = 0;

setInterval(() => {
    console.log('Frontend --> ping: ' + i);
    i++;
}, 2000 * Math.random());