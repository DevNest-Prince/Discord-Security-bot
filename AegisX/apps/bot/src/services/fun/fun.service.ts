import { EmbedBuilder } from "discord.js";
import { AegisColors } from "../../utils/ui/colors.js";

const eightBallAnswers = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

const quotes = [
  "“The only true wisdom is in knowing you know nothing.” — Socrates",
  "“In the middle of difficulty lies opportunity.” — Albert Einstein",
  "“Success is not final, failure is not fatal: it is the courage to continue that counts.” — Winston Churchill",
  "“Security is not a product, but a process.” — Bruce Schneier",
  "“Do what you can, with what you have, where you are.” — Theodore Roosevelt",
];

export class FunService {
  get8Ball(question: string): EmbedBuilder {
    const answer = eightBallAnswers[Math.floor(Math.random() * eightBallAnswers.length)]!;
    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle("🎱 Magic 8-Ball")
      .addFields(
        { name: "Question", value: question },
        { name: "Answer", value: `*${answer}*` },
      )
      .setTimestamp();
  }

  getCoinFlip(): EmbedBuilder {
    const isHeads = Math.random() < 0.5;
    return new EmbedBuilder()
      .setColor(AegisColors.Gold)
      .setTitle("🪙 Coin Flip Result")
      .setDescription(`The coin landed on **${isHeads ? "HEADS" : "TAILS"}**!`)
      .setTimestamp();
  }

  getDiceRoll(sides = 6): EmbedBuilder {
    const roll = Math.floor(Math.random() * sides) + 1;
    return new EmbedBuilder()
      .setColor(AegisColors.Cyan)
      .setTitle("🎲 Dice Roll")
      .setDescription(`You rolled a **${roll}** (1-${sides})!`)
      .setTimestamp();
  }

  getQuote(): EmbedBuilder {
    const quote = quotes[Math.floor(Math.random() * quotes.length)]!;
    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle("💬 Daily Inspiration")
      .setDescription(quote)
      .setTimestamp();
  }

  playRps(userChoice: "rock" | "paper" | "scissors"): EmbedBuilder {
    const choices = ["rock", "paper", "scissors"] as const;
    const botChoice = choices[Math.floor(Math.random() * choices.length)]!;

    let result: string;
    if (userChoice === botChoice) {
      result = "🤝 It's a Tie!";
    } else if (
      (userChoice === "rock" && botChoice === "scissors") ||
      (userChoice === "paper" && botChoice === "rock") ||
      (userChoice === "scissors" && botChoice === "paper")
    ) {
      result = "🎉 You Won!";
    } else {
      result = "🤖 Bot Won!";
    }

    return new EmbedBuilder()
      .setColor(AegisColors.Primary)
      .setTitle("✂️ Rock Paper Scissors")
      .setDescription(
        `**You Chose:** \`${userChoice.toUpperCase()}\`\n` +
        `**Bot Chose:** \`${botChoice.toUpperCase()}\`\n\n` +
        `### ${result}`,
      )
      .setTimestamp();
  }
}

export const funService = new FunService();
