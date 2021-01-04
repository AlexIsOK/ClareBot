
//documentation for this can be found here:
//https://discord.com/developers/docs/interactions/slash-commands#interaction-response-interactionresponsetype

//the documentation has been copied here for convenience

// ACK a Ping
const PONG = 1;

// ACK a command without sending a message, eating the user's input
const ACKNOWLEDGE = 2;

// respond with a message, eating the user's input
const CHANNEL_MESSAGE = 3;

// respond with a message, showing the user's input
const CHANNEL_MESSAGE_WITH_SOURCE = 4;

// ACK a command without sending a message, showing the user's input
const ACKNOWLEDGE_WITH_SOURCE = 5;

module.exports = {
    PONG, ACKNOWLEDGE, CHANNEL_MESSAGE, CHANNEL_MESSAGE_WITH_SOURCE, ACKNOWLEDGE_WITH_SOURCE
}