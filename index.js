require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } = require('discord.js');
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
  
    // Skip if it's not a directory (like .DS_Store)
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
  console.log(`✅ Logged in as ${client.user.tag}`);

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
              .setDescription('Unix timestamp for the session (e.g. 1714012800)')
              .setRequired(true)
          )
      )
      .toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('📤 Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.commandName === 'session' && interaction.options.getSubcommand() === 'create') {
    const type = interaction.options.getString('type');
    const timestamp = interaction.options.getString('timestamp');

    await interaction.reply({
      content: `✅ Session created!\n• Type: ${type}\n• Time: <t:${timestamp}:F>`,
      ephemeral: true
    });
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