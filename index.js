require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const connectDB = require('./utils/mongo');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

connectDB();

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    
    if (!fs.lstatSync(folderPath).isDirectory()) continue;
  
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const commands = [
      new SlashCommandBuilder()
        .setName('session')
        .setDescription('Manage training sessions')
        .addSubcommand(subcommand =>
          subcommand
            .setName('create')
            .setDescription('Create a new session')
            .addStringOption(option =>
              option.setName('type')
                .setDescription('Select session type')
                .setRequired(true)
                .addChoices(
                  { name: 'Store Colleague', value: 'store_colleague' },
                  { name: 'Security Guard', value: 'security_guard' }
                )
            )
            .addStringOption(option =>
              option.setName('timestamp')
                .setDescription('Unix timestamp for the session')
                .setRequired(true)
            )
        )
        .toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    console.log('⏳ Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    try {
      switch (interaction.customId) {
        case 'join_trainer':
          await interaction.reply({ content: 'You have joined as a Trainer!', ephemeral: true });
          break;
        case 'leave_session':
          await interaction.reply({ content: 'You have left the session.', ephemeral: true });
          break;
        case 'delete_session':
          await interaction.reply({ content: 'Session has been deleted.', ephemeral: true });
          break;
        case 'join_helper':
          await interaction.reply({ content: 'You have joined as a Helper!', ephemeral: true });
          break;
        case 'join_cohost':
          await interaction.reply({ content: 'You have joined as a Co-Host!', ephemeral: true });
          break;
        default:
          await interaction.reply({ content: 'Unknown button clicked.', ephemeral: true });
      }
    } catch (err) {
      console.error('Error handling button interaction:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'An error occurred while handling the button click.', ephemeral: true });
      }
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.commandName === 'session' && interaction.options.getSubcommand() === 'create') {
    try {
      console.log('⚙️ Handling /session create');
      const type = interaction.options.getString('type');
      const timestamp = interaction.options.getString('timestamp');

      const now = Math.floor(Date.now() / 1000);
      const sessionTime = parseInt(timestamp);
      const timeDiff = sessionTime - now;

      let relativeLabel;
      if (timeDiff > 86400) {
        relativeLabel = `${Math.floor(timeDiff / 86400)} days later`;
      } else if (timeDiff > 3600) {
        relativeLabel = `${Math.floor(timeDiff / 3600)} hours later`;
      } else if (timeDiff > 60) {
        relativeLabel = `${Math.floor(timeDiff / 60)} minutes later`;
      } else {
        relativeLabel = `${timeDiff} seconds later`;
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('join_trainer')
          .setLabel('Join as Trainer')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('leave_session')
          .setLabel('Leave Session')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('delete_session')
          .setLabel('Delete Session')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('join_helper')
          .setLabel('Join as Helper')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('join_cohost')
          .setLabel('Join as Co-Host')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: `Session created!\n• Host: <@${interaction.user.id}>\n• Type: ${type}\n• Time: <t:${timestamp}:F> (${relativeLabel})`,
        components: [row],
        ephemeral: false
      });
    } catch (err) {
      console.error('Error in /session create:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'There was an error creating the session.', ephemeral: true });
      }
    }
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
});

const modalHandler = require('./handlers/modalHandler');
client.on(Events.InteractionCreate, modalHandler.execute);

client.login(process.env.TOKEN);