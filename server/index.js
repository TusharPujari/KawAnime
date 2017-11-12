/**
 * Created by Kylart on 03/04/2017.
 */

'use strict'

const fs = require('fs')
const {join} = require('path')
const _ = require('lodash')
const randomString = require('randomstring')
const axios = require('axios')

const {homedir} = require('os')
const BASE_PATH = homedir()
/* istanbul ignore next */
const dir = process.env.NODE_ENV !== 'KawAnime-test'
  ? join(BASE_PATH, '.KawAnime')
  : join(BASE_PATH, '.KawAnime-test')

const _VERSION_ = require(join(__dirname, '..', 'package.json')).version

// Initiating files and directory
// Create the .KawAnime directory
const createDir = () => {
  /* istanbul ignore next */
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
}

const createConfig = () => {
  // Conf file
  const confPath = join(dir, 'config.json')

  const basicConf = {
    config: {
      fansub: 'HorribleSubs',
      quality: '720p',
      localPath: join(BASE_PATH, 'Downloads'),
      sound: 'Nyanpasu',
      inside: true,
      magnets: true,
      malUsername: '',
      system: {
        autoStart: false,
        toTray: false
      }
    }
  }

  /* istanbul ignore next */
  if (!fs.existsSync(confPath)) {
    console.log('No configuration file detected. Creating...')

    fs.writeFileSync(confPath, JSON.stringify(basicConf), 'utf-8')
  } else {
    // Checking if no key is missing. Careful, works only up to 2 levels inside config
    const currentConf = require(confPath)
    let changed = false

    _.each(basicConf.config, (elem, key) => {
      if (typeof currentConf.config[key] === 'undefined') {
        currentConf.config[key] = elem
        changed = true
      }
    })

    changed && fs.writeFileSync(confPath, JSON.stringify(currentConf), 'utf-8')
  }
}

// Local file
const createLocal = () => {
  const animeLocalPath = join(dir, 'locals.json')

  /* istanbul ignore next */
  if (!fs.existsSync(animeLocalPath)) {
    console.log('No anime local file detected. Creating...')

    fs.writeFileSync(animeLocalPath, '{}', 'utf-8')
  }
}

// List file
const createList = () => {
  const listPath = join(dir, 'lists.json')

  /* istanbul ignore next */
  if (!fs.existsSync(listPath)) {
    console.log('No anime list file detected. Creating...')

    const basicLists = {
      watchList: [],
      seen: [],
      watching: [],
      dropped: [],
      onHold: []
    }

    fs.writeFileSync(listPath, JSON.stringify(basicLists), 'utf-8')
  }
}

// History file
const createHistory = () => {
  const historyPath = join(dir, 'history.json')

  /* istanbul ignore next */
  if (!fs.existsSync(historyPath)) {
    console.log('No watch history file detected. Creating...')

    fs.writeFileSync(historyPath, '{}', 'utf-8')
  }
}

const createToken = () => {
  const tokenPath = join(dir, '_token')

  /* istanbul ignore next */
  if (!fs.existsSync(tokenPath)) {
    console.log('No token file detected. Creating...')

    fs.writeFileSync(tokenPath, randomString.generate(40), 'utf-8')
  }
}

const vault = require('./vault')
const {openExternal, openInBrowser} = require('./openExternal.js')
const seasons = require('./seasons.js')
const news = require('./news.js')
const local = require('./local.js')
const wl = require('./watchList.js')
const mal = require('./mal')
const history = require('./history')
const horrible = require('./horrible.js')
const nyaa = require('./nyaa.js')
const search = require('./search.js')

let routes = [
  (app) => {
    app.get('/getConfig.json', (req, res) => {
      const configPath = join(dir, 'config.json')
      const configFile = JSON.parse(fs.readFileSync(configPath))

      res.type('application/json')
      res.send(configFile)
    })
  },
  (app) => {
    app.get('/getLatestNyaa', ({query}, res) => {
      nyaa.getLatest(query, res)
    })
  },
  (app) => {
    app.get('/getLatest.json', ({query}, res) => {
      horrible.getLatest(query, res)
    })
  },
  /* istanbul ignore next */ (app) => {
    app.get('/openThis', ({query}, res) => {
      openExternal(query, res)
    })
  },
  (app) => {
    app.get('/seasons.json', ({query}, res) => {
      seasons.getSeason(query, res)
    })
  },
  (app) => {
    app.post('/download', (req, res) => {
      nyaa.download(req, res)
    })
  },
  (app) => {
    app.get('/news.json', (req, res) => {
      news.getNews(res)
    })
  },
  (app) => {
    app.get('/local.json', ({query}, res) => {
      local.searchLocalFiles(query, res)
    })
  },
  (app) => {
    app.get('/watchList.json', (req, res) => {
      wl.getLists(res)
    })
  },
  (app) => {
    app.post('/saveWatchList', (req, res) => {
      wl.saveWatchList(req, res)
    })
  },
  (app) => {
    app.get('/resetLocal', ({query}, res) => {
      local.resetLocal(query, res)
    })
  },
  (app) => {
    app.post('/appendHistory', (req, res) => {
      history.appendHistory(req, res)
    })
  },
  (app) => {
    app.get('/getHistory', (req, res) => {
      history.getHistory(res)
    })
  },
  (app) => {
    app.post('/removeFromHistory', (req, res) => {
      history.removeFromHistory(req, res)
    })
  },
  (app) => {
    app.post('/saveConfig', (req, res) => {
      req.on('data', (chunk) => {
        const data = JSON.parse(chunk)
        fs.writeFileSync(join(dir, 'config.json'), JSON.stringify(data))
        console.log('[Open-External]: Successfully saved config!')
      })
      res.status(200).send()
    })
  },
  (app) => {
    app.get('/searchTermOnMal', ({query}, res) => {
      search.searchTerm(query, res)
    })
  },
  (app) => {
    app.get('/getInfoFromMal', ({query}, res) => {
      query.url
        ? search.fromUrl(query, res)
        : search.fromName(query, res)
    })
  },
  /* istanbul ignore next */ (app) => {
    app.get('/_openInBrowser', (req, res) => {
      openInBrowser(res)
    })
  },
  /* istanbul ignore next */ (app) => {
    app.get('/_win', ({query}, res) => {
      const action = query.action

      if (action === 'minimize') {
        process.win.minimize()
      } else if (action === 'maximize') {
        process.win.isMaximized()
          ? process.win.unmaximize()
          : process.win.maximize()
      } else if (action === 'close') {
        process.win.close()
      }

      res.status(200).send()
    })
  },
  (app) => {
    app.get('/_env', (req, res) => {
      res.status(200).send({
        platform: process.platform,
        NODE_ENV: process.env.NODE_ENV
      })
    })
  },
  (app) => {
    app.post('/_setupAccount', (req, res) => {
      req.on('data', (chunk) => {
        const {service, credentials} = JSON.parse(chunk)

        // Writting the username in the config file so no one forgets
        const p = join(dir, 'config.json')
        const conf = require(p)
        conf.config.malUsername = credentials.username

        fs.writeFileSync(p, JSON.stringify(conf), 'utf-8')

        // Setting password into services
        vault.setupCreds(service, credentials)
          .then(() => res.send())
          .catch(() => res.status(204).send())
      })
    })
  },
  /* istanbul ignore next */ (app) => {
    app.get('/_isOnline', async (req, res) => {
      try {
        const {status} = await axios.get('https://myanimelist.net')

        res.status(status === 200 ? 200 : 204).send()
      } catch (e) {
        res.status(204).send()
      }
    })
  },
  /* istanbul ignore next */ (app) => {
    app.get('/releaseNotes', async (req, res) => {
      try {
        const {data, status} = await axios.get('https://api.github.com/repos/Kylart/KawAnime/releases')

        status === 200
          ? res.status(200).send(_.find(data, (e) => e.name === `v${_VERSION_}`).body)
          : res.status(204).send()
      } catch (e) {
        res.status(204).send()
      }
    })
  }
]

const setup = (app) => {
  createDir()
  createConfig()
  createLocal()
  createHistory()
  createList()
  createToken()

  // auto update
  /* istanbul ignore next */
  if (!['KawAnime-test', 'development'].includes(process.env.NODE_ENV)) {
    routes = require('./updater.js')(app, routes)
  }

  _.each(mal, (route) => routes.push(route))

  _.each(routes, (route) => route(app))
}

module.exports = setup
