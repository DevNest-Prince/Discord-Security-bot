import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  type Message,
} from "discord.js";
import { funService } from "../../services/fun/fun.service.js";

export const funCommand = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Community entertainment and fun minigames")
    .addSubcommand((sub) =>
      sub
        .setName("8ball")
        .setDescription("Ask the Magic 8-Ball a question")
        .addStringOption((opt) => opt.setName("question").setDescription("Your question").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("coinflip").setDescription("Flip a coin for Heads or Tails"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("roll")
        .setDescription("Roll a dice")
        .addIntegerOption((opt) => opt.setName("sides").setDescription("Number of sides (default: 6)")),
    )
    .addSubcommand((sub) =>
      sub.setName("quote").setDescription("Get a daily quote of inspiration"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rps")
        .setDescription("Play Rock Paper Scissors against the bot")
        .addStringOption((opt) =>
          opt
            .setName("choice")
            .setDescription("Your move")
            .setRequired(true)
            .addChoices(
              { name: "Rock 🪨", value: "rock" },
              { name: "Paper 📄", value: "paper" },
              { name: "Scissors ✂️", value: "scissors" },
            ),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sub = interaction.options.getSubcommand();

    if (sub === "8ball") {
      const q = interaction.options.getString("question", true);
      await interaction.reply({ embeds: [funService.get8Ball(q)] });
    } else if (sub === "coinflip") {
      await interaction.reply({ embeds: [funService.getCoinFlip()] });
    } else if (sub === "roll") {
      const sides = interaction.options.getInteger("sides") || 6;
      await interaction.reply({ embeds: [funService.getDiceRoll(sides)] });
    } else if (sub === "quote") {
      await interaction.reply({ embeds: [funService.getQuote()] });
    } else if (sub === "rps") {
      const choice = interaction.options.getString("choice", true) as any;
      await interaction.reply({ embeds: [funService.playRps(choice)] });
    }
  },

  async executePrefix(message: Message, args: string[]): Promise<void> {
    const sub = args[0]?.toLowerCase();

    if (sub === "8ball") {
      const q = args.slice(1).join(" ") || "Will I have a good day?";
      await message.reply({ embeds: [funService.get8Ball(q)] });
    } else if (sub === "coinflip" || sub === "flip") {
      await message.reply({ embeds: [funService.getCoinFlip()] });
    } else if (sub === "roll" || sub === "dice") {
      const sides = parseInt(args[1] || "6", 10);
      await message.reply({ embeds: [funService.getDiceRoll(isNaN(sides) ? 6 : sides)] });
    } else if (sub === "quote") {
      await message.reply({ embeds: [funService.getQuote()] });
    } else if (sub === "rps") {
      const choice = (args[1]?.toLowerCase() || "rock") as any;
      if (!["rock", "paper", "scissors"].includes(choice)) {
        await message.reply({ content: "❌ **Usage:** `>fun rps <rock|paper|scissors>`" });
        return;
      }
      await message.reply({ embeds: [funService.playRps(choice)] });
    } else {
      await message.reply({
        content: "🎮 **Fun Commands:**\n• `>8ball <question>`\n• `>coinflip`\n• `>roll [sides]`\n• `>quote`\n• `>rps <rock|paper|scissors>`",
      });
    }
  },
};
