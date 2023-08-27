
import projectData from '../projects.json'
import sharp from 'sharp'
import { fetch } from 'undici'
import { Readable } from 'stream'
import { finished } from 'stream/promises'
import fs from 'fs'
import fsp from 'fs/promises'

// un-hotlinks anything stored in projects.json
async function main () {
  for (let i = 0; i < projectData.length; i++) {
    const project = projectData[i];
    const thumbnail: string = project.thumbnail;
    const title: string = project.title;
    const outputFileName = `public/thumbnails/${title.replace("?", "").replace("!", "")}.webp`;
    if (!await fs.existsSync(outputFileName)) {
      let imageUri = `public/${thumbnail}`;
      if (thumbnail.startsWith("https")) {
        imageUri = `public/thumbnails/${thumbnail.split("/").at(-1)}`;
        const { body } = await fetch(thumbnail);
        const stream = fs.createWriteStream(`public/thumbnails/${thumbnail.split("/").at(-1)}`)
        await finished(Readable.from(body).pipe(stream))
      }
      sharp(imageUri)
      .resize(150)
      .toFile(outputFileName, async (err) => {
        if (err) {
          console.error(title, err)
        }
        if (thumbnail.startsWith("https")) {
          await fsp.unlink(imageUri)
        }
      })

    } else {
      console.log(`Skipping ${outputFileName} because it already exists`)
    }
  }
}

main()
