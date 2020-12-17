// SETTINGS

const TOKEN = ''; // Discord Bot Token
const PREFIX = 'ss!'; // The prefix for eval command - Slash commands use `/` as per the name.

// END OF SETTINGS

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();

client.on('ready', async () => {
  let serversword = (client.guilds.cache.size > 1) ? 'servers' : 'server';
  let usersword = (client.users.cache.size > 1) ? 'users' : 'user';

  console.log(`${client.user.username} is online and is operating on ${client.guilds.cache.size} ${serversword} for ${client.users.cache.size} ${usersword}.`);

  client.appInfo = await client.fetchApplication();
    setInterval(async () => {
      client.appInfo = await client.fetchApplication();
    }, 60000);

  client.gcommands = {};
  client.guilds.cache.forEach(async (g,i) => {
    client.gcommands[g.id] = await client.api.applications(client.user.id).guilds(g.id).commands.get()
    
    if(!client.gcommands[g.id].map(m => m.name).includes('ping')) {
      client.api.applications(client.user.id).guilds(g.id).commands.post({data: {
        name: 'ping',
        description: 'The bot\'s ping'
      }})
    }
    if(!client.gcommands[g.id].map(m => m.name).includes('dumbass')) {
      client.api.applications(client.user.id).guilds(g.id).commands.post({data: {
        name: 'dumbass',
        description: 'Your a dumbass'
      }})
    }
    if(!client.gcommands[g.id].map(m => m.name).includes('permissions')) {
      client.api.applications(client.user.id).guilds(g.id).commands.post({data: {
        "name": "permissions",
        "description": "Get or edit permissions for a user or a role",
        "options": [
            {
              "name": "user",
              "description": "Get or edit permissions for a user",
              "type": 2, // 2 is type SUB_COMMAND_GROUP
              "options": [
                {
                  "name": "get",
                  "description": "Get permissions for a user",
                  "type": 1 // 1 is type SUB_COMMAND
                },
                {
                  "name": "edit",
                  "description": "Edit permissions for a user",
                  "type": 1
                }
              ]
            },
            {
              "name": "role",
              "description": "Get or edit permissions for a role",
              "type": 2,
              "options": [
                  {
                      "name": "get",
                      "description": "Get permissions for a role",
                      "type": 1
                  },
                  {
                      "name": "edit",
                      "description": "Edit permissions for a role",
                      "type": 1
                  }
              ]
            }
        ]
      }})
    }
  })
});




client.ws.on('INTERACTION_CREATE', async interaction => {
  switch (interaction.data.name) {

    case 'ping':
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
          content: `My ping is ${client.ws.ping}!`
        }
      }})
      break;
    
    case 'dumbass':
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
          content: `Your a dumbass`
        }
      }})
      break;

    case 'permissions':
      client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
          content: `You typed \`/${interaction.data.name} ${interaction.data.options[0].name} ${interaction.data.options[0].options[0].name}\``
        }
      }})
      break;
  
    default:
      break;
  }
})

client.on('message', (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
  const { member, author, channel, content, guild } = message;

  const fixedUsername = client.user.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PrefixRegex = new RegExp(`^(<@!?${client.user.id}>|${fixedUsername}|${PREFIX})`, 'i', '(\s+)?');
  let usedPrefix = content.match(PrefixRegex);
  usedPrefix = usedPrefix && usedPrefix.length && usedPrefix[0];

  // Mention related tasks
  const MentionRegex = new RegExp(`^(<@!?${client.user.id}>)`);
  const mentioned = MentionRegex.test(content);
  const helpPrefix = `👋 Hai! My prefix is: ${PREFIX}`;

  if(!usedPrefix) return; // Exit if its not using a prefix
  
  const args = message.content.slice(usedPrefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if (command == "eval") {
    let isTeamMember = client.appInfo.owner.members ? client.appInfo.owner.members.includes(author.id) : false
    let isSingleOwner = client.appInfo.owner.id ? client.appInfo.owner.id == author.id : false
    if(!isTeamMember && !isSingleOwner) return message.channel.send('Sorry, but we cannot give you access to this command.')


    const { inspect } = require('util');
    const embed = new MessageEmbed().setFooter(message.author.username, message.author.avatarURL())
    const query = args.join(' ')
    if (query) {
      const code = (lang, code) => (`\`\`\`${lang}\n${String(code).slice(0, 1000) + (code.length >= 1000 ? '...' : '')}\n\`\`\``).replace(new RegExp(client.token), '*'.repeat(client.token.length))
      try {
        const evald = eval(query)
        const res = (typeof evald === 'string' ? evald : inspect(evald, { depth: 0 }))
        embed.addField('Result', code('js', res))
          .addField('Type', code('css', typeof evald === 'undefined' ? 'Unknown' : typeof evald))
          .setColor('#8fff8d')
      } catch (err) {
        embed.addField('Error', code('js', err))
          .setColor('#ff5d5d')
      } finally {
        message.channel.send(embed).catch(err => {
            message.channel.send(`There was an error while displaying the eval result! ${err.message}`)
          })
      }
    } else {
      message.channel.send('Please, write something so I can evaluate!')
    }
  }
});

if(TOKEN == null) return console.log('The discord bot token is not set.') && process.exit(0);
client.login(TOKEN).catch(err => console.log(err));
