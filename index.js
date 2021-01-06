#!/usr/bin/node

const Discord = require("discord.js-light");
const util    = require("./util.js");
const types   = require("./message-type.js");

const client  = new Discord.Client({
    cacheGuilds: false,
    cacheChannels: false,
    cacheOverwrites: false,
    cacheRoles: false,
    cacheEmojis: false,
    cachePresences: false,
    fetchAllMembers: false,
    cacheMembers: false
});

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
        console.log(`posting ${commands[i].name}`);
        
        //the command to be sent to discord
        console.log(`command ${i} is ${commands[i].name} with endpoint ${commands[i].endpoint}`);
        
        const cmdtmp = {data: commands[i]};
        
        //post the commands
        await client.api.applications(client.user.id).commands.post(cmdtmp);
    }
    console.log("Done registering commands.");
    
    await client.user.setActivity("/help", {type: "WATCHING"});
});

/**
 * On /command used.
 */
client.ws.on('INTERACTION_CREATE',  async interaction => {
    console.log("running " + interaction.data.name);
    
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
        
        //check the title stuff
        let title = a.titleB;
        if(title && interaction.data.options) {
            title = title.replace("%AUTHOR;", `<@${interaction.member.user.id}>`).replace("%MENTIONED;", `<@${interaction.data.options[0].value}>`)
        } else {
            title = a.titleA;
        }
        
        return util.sendImage(a.endpoint, interaction, client, title);
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
            await ch.send(`${interaction.data.options[1].value} content: \`${interaction.data.options[0].value}\` by user ${interaction.member.user.id}`);
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {content: "This has been reported.  It will be investigated soon.\n" +
                    "If you have more content to report, please do so."});
        case "privacy":
            return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {content: "" +
                    "**Privacy policy for the bot**:\n" +
                    "Only servers are cached, however users, messages, and other things are not.\n" +
                    "This is mostly done because they use a lot of resources, but also because the bot does not use them.\n" +
                    "If you use the /report command, your user ID (which is public) will be submitted to prevent abuse; however, that " +
                    "is not shared to anyone except the bot author and the API owner.\n" +
                    "The bot logs commands ran, but not who runs them.  For example, if you do /pat <@783414630831226920>, " +
                    "the message `running pat` will appear on my end, but not anything that identifies you." +
                    "\n\n" +
                    "Feel free to email me at alex@alexisok.dev if you have any questions :)"});
        case "invite":
            let dm = interaction.data.options[0].value; //boolean type
            if(dm) {
                client.users.fetch(interaction.member.user.id, false, true).then(async (u) => {
                    await u.send("Here is the invite link for the bot:\n\n" +
                        "https://discord.com/oauth2/authorize?client_id=783414630831226920&scope=bot+applications.commands&permissions=0");
                });
                return await util.sendGenericMessage(interaction, client, types.ACKNOWLEDGE_WITH_SOURCE, {});
            } else {
                return await util.sendGenericMessage(interaction, client, types.CHANNEL_MESSAGE_WITH_SOURCE, {content: "Here is the invite link for the bot:\n\n" +
                        "https://discord.com/oauth2/authorize?client_id=783414630831226920&scope=bot+applications.commands&permissions=0"})
            }
            
    }
});

console.log("Logging in");

//authentication stuff
const auth = require("./secrets.json");

client.login(auth.token).then(() => console.log("Logged in"));

//start server count stuff

const DBL = require("dblapi.js");
const child_process = require("child_process");

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