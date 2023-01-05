#!/usr/bin/env node

const { Configuration, OpenAIApi } = require("openai");
const commander = require("commander");
const prompts = require("prompts");
const chalk = require("chalk");
const gradient = require("gradient-string");
const fs = require("fs");

const saveApiKey = (apiKey) => {
  fs.writeFileSync("./apiKey.txt", apiKey);
};

const getApiKey = () => {
  if (fs.existsSync("./apiKey.txt")) {
    return fs.readFileSync("./apiKey.txt", "utf8");
  }
};

const apiKeyPrompt = async () => {
  let apiKey = getApiKey();
  if (!apiKey) {
    const response = await prompts({
      type: "password",
      name: "apiKey",
      message: "Enter your OpenAI API key:",
      validate: (value) => {
        return value !== "";
      },
    });

    apiKey = response.apiKey;
    saveApiKey(apiKey);
  }

  return apiKey;
};

const intro = function () {
  const usageText = `
  ${gradient(
    "cyan",
    "pink"
  )("****************")} Welcome to ${chalk.greenBright(
    "terminalGPT"
  )} ${gradient("cyan", "pink")("****************")}

  ${gradient("orange", "yellow").multiline(
    ["  __", "<(o )___", " ( ._> /", "  `---'"].join("\n")
  )} 
  
  ${chalk.yellowBright("usage:")}
    Terminal will prompt you to enter a message. Type your message and press enter.
    Terminal will then prompt you to enter a response. Type your response and press enter.

    To exit, type "${chalk.redBright("exit")}" and press enter.


  `;

  console.log(usageText);
};

commander
  .command("chat")
  .option("-e, --engine <engine>", "GPT-3 model to use")
  .option("-t, --temperature <temperature>", "Response temperature")
  .usage(`"<project-directory>" [options]`)
  .action((options) => {
    intro();
    apiKeyPrompt().then((apiKey) => {
      const configuration = new Configuration({
        apiKey,
      });
      const openai = new OpenAIApi(configuration);

      const prompt = async () => {
        const response = await prompts({
          type: "text",
          name: "value",
          message: `${chalk.blueBright("You: ")}`,
          validate: (value) => {
            return true;
          },
        });

        if (response.value !== "exit") {
          const request = await openai.createCompletion({
            model: options.engine || "text-davinci-002",
            prompt: response.value,
            max_tokens: 2048,
            temperature: parseInt(options.temperature) || 0.5,
          });
          if (!request.data.choices?.[0].text) {
            return res.status(500).json({ message: "Something went wrong" });
          }

          // map all choices to text
          const getText = request.data.choices.map((choice) => choice.text);

          console.log(`${chalk.cyan("GPT-3: ")}`);
          // console log each character of the text with a delay and then call prompt when it finished
          let i = 0;
          const interval = setInterval(() => {
            if (i < getText[0].length) {
              process.stdout.write(getText[0][i]);
              i++;
            } else {
              clearInterval(interval);
              console.log("\n");
              prompt();
            }
          }, 10);
        }
      };

      prompt();
    });
  });

commander.parse(process.argv);