import { Message, PermissionFlagsBits } from 'discord.js';

export async function handleModerationCommands(message: Message, commandName: string, args: string[]) {
  if (!message.guild) return;

  // 1. Ping Command
  if (commandName === 'ping') {
    const sent = await message.reply('Pinging...');
    const latency = sent.createdTimestamp - message.createdTimestamp;
    await sent.edit(`🏓 Pong! Latency: \`${latency}ms\` | API Latency: \`${Math.round(message.client.ws.ping)}ms\``);
    return;
  }

  // 2. Purge / Clear Messages Command
  if (commandName === 'purge' || commandName === 'clear') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply('❌ You do not have permission to manage messages.');
      return;
    }

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      await message.reply('⚠️ Please provide a number between 1 and 100 for message deletion.');
      return;
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: amount + 1 });
      if ('bulkDelete' in message.channel) {
        await message.channel.bulkDelete(fetched, true);
        const confirm = await message.channel.send(`🧹 Successfully deleted \`${amount}\` messages.`);
        setTimeout(() => confirm.delete().catch(() => {}), 3000);
      }
    } catch (error) {
      await message.reply('❌ Failed to delete messages. Make sure messages are not older than 14 days.');
    }
    return;
  }

  // 3. Server Info Command
  if (commandName === 'serverinfo') {
    const guild = message.guild;
    await message.reply({
      content: `📊 **Server Information for ${guild.name}**\n- Owner ID: \`${guild.ownerId}\`\n- Members: \`${guild.memberCount}\`\n- Created At: \`${guild.createdAt.toDateString()}\``
    });
    return;
  }
}