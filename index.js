#!/usr/bin/node

const Discord = require("discord.js");
const fetch   = require('node-fetch');

const client  = new Discord.Client();

//commands and their endpoints
const commands = require("./commands.json");


//https://shiro.gg/api/endpoints

/**
 * Get the image or whatever
 * @param path the path as it appears relative to shiro.gg/api/ (with trailing /)
 */
async function getThing(path) {
    let returnUrl;
    const req = await fetch("https://shiro.gg/api/" + path, {method: "Get"})

    if(req.status !== 200) {
        console.error("Error: " + req.status + " is the bot being rate limited?");
    }

    const res = await req.json();

    if (!res.url) {
        console.error("Error: the result URL was not defined!  res: " + res);
    }

    return res.url
}

client.on('ready',  async () => {
    console.log("Logged in as " + client.user.username);

    for(let i = 0; i < commands.length; i++) {
        console.log("posting " + commands[i].name);

        //the command to be sent to discord
        const cmdtmp = {data: {name: commands[i].name, description: commands[i].description}};

        //post the commands
        await client.api.applications(client.user.id).commands.post(cmdtmp);
    }
});

/**
 * Send the image to Discord
 * @param path the path as it appears relative to shiro.gg/api/
 * @param interaction the interaction
 * @returns {Promise<void>} nothing
 */
async function sendImage(path, interaction) {

    const sendFile = await getThing(path);

    console.log("Sending " + sendFile);

    let embed = await new Discord.MessageEmbed()
        .setImage(sendFile)
        .setColor("RANDOM")
        .setTitle("Here is your image (it may take a second to load)")

    await client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4, //message and display /command
            data: {
                embeds: [embed]
            }
        }
    });
}

/**
 * Tests to see if a channel is NSFW or not.
 * @param interaction the interaction.
 * @returns {boolean} true if it is, false otherwise.
 */
async function isChannelNSFW(interaction) {
    let nsfw = false;

    try {
        let c = await client.channels.fetch(interaction.channel_id, true, true);
        c = await c.fetch(true);

        nsfw = c.nsfw;
    } catch(e) {
        console.error(e);
        //fallback to false to avoid any nsfw in general incidents
        //in case of errors.
        return false;
    }
    return nsfw;
}

/**
 * Warn a user that the channel is NOT marked NSFW.
 * @param interaction the interaction.
 */
function warnNotNSFW(interaction) {
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4,
            data: {
                content: "Sorry, but this command can only be used in channels marked NSFW.\n" +
                    "Please enter a NSFW text channel if you want to use this command."
            }
        }
    });
}

/**
 * On /command used.
 */
client.ws.on('INTERACTION_CREATE',  async interaction => {
    console.log("passed " + interaction.data.name);

    //command name
    const command = interaction.data.name.toLowerCase();

    //get the command from the commands object
    const a = commands.filter(cm => cm.name === command)[0];

    //make sure the command exists in case one was deleted.
    if(!a) return;

    //check if the endpoint exists
    if(a.endpoint) {
        if(a.nsfw && !await isChannelNSFW(interaction))
            return warnNotNSFW(interaction);

        return sendImage(a.endpoint, interaction);
    }

    //if the command doesn't have an endpoint, check to see if it is here.
    switch(command) {
        case "ping":
            client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: {
                        content: "Pong!  " + client.ws.ping + " ms.\n"
                    }
                }
            });
            break;
        case "credits":
            client.api.interactions(interaction.id, interaction.token).callback.post({
                data: {
                    type: 4,
                    data: {
                        content: "I am using https://shiro.gg/api/endpoints by Xignotic, https://xignotic.dev/\n" +
                            "This bot was made by AlexIsOK, https://alexisok.dev/"
                    }
                }
            });
            break;
    }
});

console.log("Logging in");

//authentication stuff
const auth = require("./secrets.json");

client.login(auth.token);