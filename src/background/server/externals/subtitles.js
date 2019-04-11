import MatroskaSubtitles from 'matroska-subtitles'
import { Logger } from '../utils'
import { eventsList } from '../../../vendor'

const logger = new Logger('Subtitles')
const events = eventsList.video

function generateHandlers (event) {
  return {
    tracks: (tracks) => event.sender.send(events.tracks.success, tracks),
    subtitle: (subtitle, trackNumber) => event.sender.send(events.subtitles.success, { subtitle, trackNumber })
  }
}

function generateParser (handlers) {
  const parser = new MatroskaSubtitles()

  if (handlers.tracks) {
    parser.on('tracks', handlers.tracks)
  }

  if (handlers.subtitle) {
    parser.on('subtitle', handlers.subtitle)
  }

  return parser
}

export default function (event, stream) {
  const parser = generateParser(generateHandlers(event))

  stream.pipe(parser)

  logger.info('Parsing subtitles for video')
}