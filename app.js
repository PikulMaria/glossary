const express = require('express');
const http = require('http');
const fs = require('fs');
const url = require('url');
const app = express();

let dictionary = null;

const dictionaryHandler = (request, response) => {
    const u = url.parse(request.url);

    if (u.pathname === '/readyz') {
        if (dictionary) {
            response.status(200).send('OK');
        } else {
            response.status(404).send('Not Loaded');
        }
        return;
    }

    const key = u.pathname.length > 0 ? decodeURIComponent(u.pathname.substr(1)) : '';
    const def = dictionary ? findDefinition(key) : null;

    if (!def) {
        response.status(404).send(`${key} was not found`);
        return;
    }

    response.status(200).send(def);
};

const loadDictionary = (file, callback) => {
    fs.readFile(file, (err, data) => {
        if (err) {
            console.log(err);
            callback(err);
            return;
        }
        dictionary = JSON.parse(data);
        console.log('Dictionary loaded.');
        callback();
    });
};

function findDefinition(term) {
    const foundTerm = Object.keys(dictionary).find((key) => key.toUpperCase() === term.toUpperCase());
    return foundTerm ? dictionary[foundTerm] : null;
}

loadDictionary('/my-dictionary.json', (err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Ready to serve');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/define/:term', (req, res) => {
    const term = decodeURIComponent(req.params.term);
    const definition = findDefinition(term);

    if (!definition) {
        res.status(404).json({ error: `${term} was not found` });
    } else {
        res.json({ term, definition });
    }
});

const server = http.createServer(app);

const PORT = process.env.PORT || 8080;

server.listen(PORT, (err) => {
    if (err) {
        return console.log('Error starting server: ' + err);
    }

    console.log(`Server is listening on port ${PORT}`);
});
