
import axios from 'axios'
import projectData from '../projects.json'
import { readFile } from 'fs/promises'

interface IProjectButtonData {
  prefix: string
  locationName: string
  link: string
  target: string
}
  
interface IProject {
  type: 'IProject',
  title: string
  tags: Array<string>
  summary: string
  buttons: Array<IProjectButtonData>
  thumbnail: string
  lastUpdate: string,
  ghFullName: string,
  pullUpdatedInfoFrom: string,
  ghStars: number
}

interface GHUser {
  login: string,
  id: number,
  node_id: string,
  avatar_url: string,
  url: string,
  html_url: string,
  followers_url: string,
  following_url: string,
  gists_url: string,
  starred_url: string,
  subscriptions_url: string,
  organizations_url: string,
  repos_url: string,
  events_url: string,
  received_events_url: string,
  type: string,
  name: string,
  company?: string,
  blog: string,
  location?: string,
  email?: string,
  hirable?: string,
  bio: string,
  twitter_username?: string,
  public_repos: number,
  public_gists: number,
  followers: number,
  following: number,
  created_at: string,
  updated_at: string
}

interface GHLicense {
  key: string,
  name: string,
  spdx_id: string,
  url: string,
  node_id: string
}

interface GHRepo {
  id: string,
  node_id: string,
  name: string,
  full_name: string,
  private: boolean,
  owner: GHUser,
  html_url: string,
  description: string,
  fork: boolean,
  url: string,
  forks_url: string,
  keys_url: string,
  collaborators_url: string,
  teams_url: string,
  hooks_url: string,
  issue_events_url: string,
  events_url: string,
  assignees_url: string,
  branches_url: string,
  tags_url: string,
  blobs_url: string,
  git_tags_url: string,
  git_refs_url: string,
  trees_url: string,
  statuses_url: string,
  languages_url: string,
  stargazers_url: string,
  contributors_url: string,
  subscribers_url: string,
  subscription_url: string,
  commits_url: string,
  git_commits_url: string,
  comments_url: string,
  issue_comment_url: string,
  contents_url: string,
  compare_url: string,
  merges_url: string,
  archive_url: string,
  downloads_url: string,
  issues_url: string,
  pulls_url: string,
  milestones_url: string,
  notifications_url: string,
  labels_url: string,
  releases_url: string,
  deployments_url: string,
  created_at: string,
  updated_at: string,
  pushed_at: string,
  git_url: string,
  ssh_url: string,
  clone_url: string,
  svn_url: string,
  homepage?: string,
  size: number,
  stargazers_count: number,
  watchers_count: number,
  language?: string,
  has_issues: boolean,
  has_projects: boolean,
  has_downloads: boolean,
  has_wiki: boolean,
  has_pages: boolean,
  has_discussions: boolean,
  forks_count: number,
  mirror_url?: string,
  archived: boolean,
  disabled: boolean,
  open_issues_count: number,
  license: GHLicense,
  allow_forking: boolean,
  is_template: boolean,
  web_commit_signoff_required: boolean,
  topics: Array<any>,
  visibility: string,
  forks: number,
  open_issues: number,
  watchers: 0,
  default_branch: string
}

interface GHRelease {
  // there are more fields, but I only care about this one rn
  published_at: string
}

interface CommitAuthor {
  date: string
}

interface Commit {
  author: CommitAuthor
}

interface GHCommit {
  commit: Commit
}

// optionally pull in an API key for GH from a local file
const getEnvironment = async () => {
  try {
    const file = await readFile('./environment.json')
    return JSON.parse(file.toString())
  } catch {
    return null
  }
}

const fetch = async (urlString : string) : Promise<any> => {
  const environment = await getEnvironment()
  const url = new URL(urlString)
  const headers = environment !== null?{
    Accept: 'application/vnd.github+json',
    Authorization: `token ${environment.token}`
  }:{}
  const response = await axios({
    method: 'get',
    url: `${url.protocol}//${url.hostname}${url.pathname}`,
    headers
  })
  return response.data as any
}

const fetchGH = async (path : string, endpoint : string) : Promise<any> => {
  return fetch(`https://api.github.com/${path}/${endpoint}`)
}

const fetchGHUser = async (username : string) : Promise<GHUser> => {
  return await fetchGH('users', username) as GHUser
}

const fetchRepoByFullName = async (fullName : string) : Promise<GHRepo> => {
  return await fetchGH('repos', fullName) as GHRepo
}

export async function fetchUpdatedProjectData() : Promise<IProject[]> {
  const projects = (projectData as IProject[])
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const repo = await fetchRepoByFullName(project.ghFullName) 
    project.ghStars = repo.stargazers_count
    switch (project.pullUpdatedInfoFrom) {
      case 'commits':
        // hacky af 🤷‍♀️
        const commitsUrl = repo.commits_url.split('{')[0]
        const commits = await fetch(commitsUrl) as GHCommit[]
        if (commits.length > 0) {
          project.lastUpdate = commits[0].commit.author.date
        }
        break
      case 'releases':
        // hacky af 🤷‍♀️
        const releaseUrl = repo.releases_url.split('{')[0]
        const releases = await fetch(releaseUrl) as GHRelease[]
        if (releases.length > 0) {
          project.lastUpdate = releases[0].published_at
        }
        break
      default:
        break
    }
  }
  return projects
}

