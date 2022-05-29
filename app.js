const express = require('express')
const favicon = require('serve-favicon')
const multer = require('multer')
const path = require('path')
const fileReader = require('./readFile.js')

const app = express()

app.set('view engine', 'ejs');
app.use(favicon(path.join(__dirname + '/favicon.ico')));

let packageList = [];

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/:packageNameToFind', (req, res) => {
    const packageNameToFind = req.params.packageNameToFind;
    let filteredList = packageList.filter(package => {
        return package.name === packageNameToFind
    })
    const foundPackage = filteredList[0]

    res.render('file-details', { package: foundPackage })
})

app.post('/uploaded', (req, res) => {
    let upload = multer().single('submittedFile');

    upload(req, res, function (err) {
        packageList = fileReader.readFile(req.file)
        res.render('file-index', { indexList: packageList })
    });
})

app.listen(3000, () => {
    console.log(`Example app listening on port 3000`)
})