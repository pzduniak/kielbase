const Bot = require('keybase-bot')
const request = require('request-promise')
const bot = new Bot()
const generateMsg = require('./msg.js').generateMsg

async function main() {
  try {
    await bot.init(process.env.KB_USERNAME, process.env.KB_PAPERKEY, {verbose: false})

    await bot.chat.clearCommands()
    await bot.chat.advertiseCommands({
      advertisements: [
        {
          type: 'public',
          commands: [
            {
              name: 'kielbase',
              description: 'The easiest way to acquire some Polish sausage.',
            },
          ]
        }
      ],
    })

    const onMessage = async message => {
      if (message.content.type !== 'text') {
        return
      }

      if (!message.content.text.body.startsWith('!kielbase')) {
        return
      }

      bot.chat.send(message.channel, {
        body: await generateMsg(),
      })
    }

    const onError = e => console.error(e)
    console.log(`Listening for messages...`)
    bot.chat.watchAllChannelsForNewMessages(onMessage, onError)
  } catch(e) {
    console.error(e)
  }
}

async function shutDown() {
  await bot.deinit()
  process.exit()
}

process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)

main()
