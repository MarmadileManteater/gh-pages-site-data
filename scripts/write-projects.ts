
import { fetchUpdatedProjectData } from "./fetch-projects"
import { writeFile } from 'fs/promises'

(async () => {
  const newProjectJSON = JSON.stringify(await fetchUpdatedProjectData(), null, 2)
  await writeFile('./projects.json', newProjectJSON)
})()
