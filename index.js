#!/usr/bin/node

const Discord = require("discord.js-light");
const util    = require("./util.js");
const types   = require("./message-type.js");

const client  = new Discord.Client();

//commands and their endpoints
const commands = require("./commands.json");

//generate the help command
let re = "```\n";

commands.forEach(c => {
    re += "/" + c.name + " - " + c.description + "\n";
});

re += "```";
const helpCommand = new Discord.MessageEmbed().setDescription(re);

//credits command
const credits = new Discord.MessageEmbed()
    .setDescription("I am using [shiro.gg](https://shiro.gg/api/endpoints) for all of the images, made by Xignotic, https://xignotic.dev/\n" +
        "This bot itself was made by AlexIsOK, https://alexisok.dev/\n\n" +
        "[You can invite the bot here](https://discord.com/oauth2/authorize?client_id=783414630831226920&scope=bot+applications.commands&permissions=0).\n\n\n" +
        "If you find any content you deem illegal or against the TOS, please report it using the /report command.");

client.on('ready',  async () => {
    console.log("Logged in as " + client.user.username);

    for(let i = 0; i < commands.length; i++) {
        console.log("posting " + commands[i].name);

        //the command to be sent to discord
        console.log(`command ${i} is ${commands[i].name} with endpoint ${commands[i].endpoint}`);

        const cmdtmp = {data: commands[i]};

        //post the commands
        await client.api.applications(client.user.id).commands.post(cmdtmp);
    }
    console.log("done registering commands.");
});

//guild create event to make sure that both bot and applications.commands
//scopes are granted
client.on("guildCreate", async (guild) => {
    client.fetchApplication().then(app => {

    })
})

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
        //if the command is nsfw and the channel isn't nsfw, warn the user.
        if(a.nsfw && !await util.isChannelNSFW(interaction, client))
            return util.warnNotNSFW(interaction, client);

        return util.sendImage(a.endpoint, interaction, client);
    }

    //if the command doesn't have an endpoint, check to see if it is here.
    switch(command) {
        case "ping":
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {content: "Pong!  " + client.ws.ping + " ms.\n"});
        case "credits":
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {embeds: [credits]});
        case "help":
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {embeds: [helpCommand]});
        case "report":
            let ch = await client.channels.fetch("795472459214225458", false, true);
            await ch.send(`Reported content: \`${interaction.data.options[0].value}\` by user ${interaction.member.user.id}`);
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {content: "This has been reported.  It will be investigated soon.\n" +
                    "If you have more content to report, please do so."});
    }
});

console.log("Logging in");

//authentication stuff
const auth = require("./secrets.json");

client.login(auth.token).then(() => console.log("Logged in"));

//start server count stuff

const DBL = require("dblapi.js");

if(auth.topgg) {
    const dbl = new DBL(auth.topgg);

    //log when posted
    dbl.on("posted", () => {
        console.log("Server count posted");
    });

    //log errors
    dbl.on("error", (e) => {
        console.error("Server count posting failed!")
        console.error(require("util").inspect(e, true, null));
    });
}