const express = require('express')

let fs = require('fs');
require('instapromise')
const reload = require('reload');

const app = express()

reload(app);

let size = 250;
let fullSize = 600;
let columns = 6;


async function addImageAsync(req, res) {
    try {
        let { url, description, postedBy } = req.query;
        await fs.promise.appendFile('./images.data', JSON.stringify({ url, description, postedBy }) + "\n", 'utf8');
        res.send("OK");
    } catch (e) {
        res.status(500).send('Failed to write data');
    }

}

async function mainAsync(req, res) {
    let contents = await fs.promise.readFile('./images.data', 'utf8');
    let lines = contents.split("\n");
    let z = `
<html>
<head>
<title>Meme Collage</title>
<style>
.memeImage {
    display: block;
    max-width: ${size}px;
    max-height: ${size}px;
    object-fit: cover;
    min-width: ${size}px;
    min-height: ${size}px;
}
.cell {
    padding: 1px;
}
</style>
</head>
<body>
<script src="/reload/reload.js"></script>
<table>

    `;
    let data = [];
    for (let line of lines) {
        try {
            data.push(JSON.parse(line));
        } catch (e) {
            console.error("Problem parsing `" + line + "`");
        }
    }

    let row = 0;
    let col = 0;
    data.reverse();
    for (let img of data) {
        if (col === 0) {
            z += "<tr>";
        }
        let { postedBy, url, description, } = img;
        z += `<td class="cell"><a href="/showImage?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}&postedBy=${encodeURIComponent(postedBy)}"><img class="memeImage" src="${url}" /></a><br /><center><i>${escape(postedBy || '-')}</i></center></td>\n`;
        col++;
        if (col === columns) {
            row++;
            col = 0;
            z += "</tr>\n";
        }
    }
    if (col > 0) {
        z += "</tr>";
    }

    z += `
</table>
</body>
</html>
    `;
    res.send(z);
}

async function showImageAsync(req, res) {

    let postedBy = req.query.postedBy;
    if (postedBy === 'undefined') {
        postedBy = '';
    }

    let description = req.query.description;
    if (description === 'undefined') {
        description = '';
    }

    let title = '';
    if (postedBy || description) {
        title = ' - ' + description;
        if (postedBy) {
            title += ' by ' + postedBy;
        }
    }
    let z = `
<html>
<head>
<title>Meme Collage${title}</title>
<style>
.container {
    display: flex;
    flex: 1;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}
.image {
    max-height: ${fullSize}px;
    min-height: ${fullSize}px;
    max-width: ${fullSize}px;
    min-width: ${fullSize}px;
    object-fit: cover;
}
</style>
</head>
<body>
<div class="container">
<img src="${req.query.url}" class="image" />
<div>
<center>
<i>${escape(postedBy || '')}</i>
</center>
</div>
</div>
</body>
</html>

    `;
    res.send(z);

}

app.get('/', (req, res) => {
    mainAsync(req, res);
});

app.get('/addImage', (req, res) => {
    addImageAsync(req, res);
});

app.get('/showImage', (req, res) => {
    showImageAsync(req, res);
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
