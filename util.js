
const fetch   = require("node-fetch");
const Discord = require("discord.js-light");

/**
 * Get the image or whatever
 * @param path the path as it appears relative to shiro.gg/api/ (with trailing /)
 */
async function getThing(path) {
    const req = await fetch("https://shiro.gg/api/" + path, {method: "Get"})
    
    if(req.status !== 200) {
        console.error("Error: " + req.status + " is the bot being rate limited?");
    }
    
    const res = await req.json();
    
    if (!res.url) {
        console.error("Error: the result URL was not defined!  res: " + res);
    }
    
    return res.url;
}

/**
 * Send the image to Discord
 * @param path the path as it appears relative to shiro.gg/api/
 * @param interaction the interaction.
 * @param client the discord client.
 * @param title the optional title
 * @returns {Promise<void>} nothing
 */
async function sendImage(path, interaction, client, title) {
    
    title = title || "Here is your image (it may take a second to load)";
    
    const sendFile = await getThing(path);
    
    console.log("Sending " + sendFile);
    
    let embed = await new Discord.MessageEmbed()
        .setImage(sendFile)
        .setColor("RANDOM")
        .setDescription(title);
    
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
 * @param client the discord client.
 * @returns {boolean} true if it is, false otherwise.
 */
async function isChannelNSFW(interaction, client) {
    let nsfw = false;
    
    try {
        let c = await client.channels.fetch(interaction.channel_id, false, true);
        c = await c.fetch(true); //force fetch the channel
        
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
 * @param client the discord client.
 */
async function warnNotNSFW(interaction, client) {
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: 4,
            data: {
                content: "Sorry, but this command can only be used in channels marked NSFW.\n" +
                    "Please enter a NSFW text channel if you want to use this command.\n\n" +
                    "If you just recently changed the channel to NSFW, please wait a minute."
            }
        }
    });
}

/**
 * Send a message to discord in response to a /command.
 * @param interaction the interaction.
 * @param client the discord client
 * @param messageType the type of the message as described in message-type.js
 * @param data the data field to send.
 * @returns {Promise<void>} nothing.
 */
async function sendGenericMessage(interaction, client, messageType, data) {
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data: {
            type: messageType,
            data: data
        }
    });
}

//export everything
module.exports = {
    getThing, sendImage, sendGenericMessage, isChannelNSFW, warnNotNSFW
}