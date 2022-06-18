import express, { Request, Response } from "express";
const app = express();
import * as fs from 'fs';
import path from "path";

const PORT = 3000;
const VIDEOS_PATH: string = path.resolve('./') + '/videos';

/**
 * get directory files
 */
app.get("/", (req: Request, res: Response) => {

  let files: string[] = [];
  let msg: string = "";
  let status: boolean = false;

  if (fs.existsSync(VIDEOS_PATH)) {
    status = true;
    files = fs.readdirSync(VIDEOS_PATH);
  } else {
    msg = "Directory exists!";
  }

  res.json({
    msg: msg,
    status: status,
    data: files
  })

});

app.get('/video/:id', function (req, res) {
  const vidoePath = VIDEOS_PATH + '/' + req.params.id;

  if (!fs.existsSync(vidoePath)) {
    return res.json({
      status: false,
      msg: "Video exists!"
    })
  }

  const stat = fs.statSync(vidoePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(vidoePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head);
    fs.createReadStream(vidoePath).pipe(res);
  }
})

app.listen(PORT, () => console.log("Server listening on http://localhost:" + PORT));
