const { Events } = require('discord.js');
const Session = require('../models/Session');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'sessionCreateModal') {
      const plannedTime = interaction.fields.getTextInputValue('plannedTime');
      const sessionType = interaction.fields.getTextInputValue('sessionType');
      const sessionStatus = interaction.fields.getTextInputValue('sessionStatus');

      // Save to MongoDB
      try {
        const session = new Session({
          plannedTime,
          sessionType,
          sessionStatus,
          createdBy: interaction.user.id,
        });

        await session.save();

        await interaction.reply({
          content: `✅ Session created!\n• **Time**: <t:${plannedTime}:F>\n• **Type**: ${sessionType}\n• **Status**: ${sessionStatus}`,
          ephemeral: true
        });
      } catch (error) {
        console.error('❌ Error saving session:', error);
        await interaction.reply({
          content: 'There was an error saving the session. Please try again later.',
          ephemeral: true
        });
      }
    }
  }
};