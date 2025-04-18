const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessions')
    .setDescription('Session commands')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new training session')
    ),

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const modal = new ModalBuilder()
      .setCustomId('sessionCreateModal')
      .setTitle('Create Training Session');

    const timeInput = new TextInputBuilder()
      .setCustomId('plannedTime')
      .setLabel('Enter planned time (UNIX timestamp)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const typeInput = new TextInputBuilder()
      .setCustomId('sessionType')
      .setLabel('Session Type (Store Colleague / Security Guard)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const statusInput = new TextInputBuilder()
      .setCustomId('sessionStatus')
      .setLabel('Session Status (Started / Canceled / Not Started / Ended)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(timeInput);
    const secondRow = new ActionRowBuilder().addComponents(typeInput);
    const thirdRow = new ActionRowBuilder().addComponents(statusInput);

    modal.addComponents(firstRow, secondRow, thirdRow);

    await interaction.showModal(modal);
  }
};