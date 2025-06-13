import * as restify from 'restify';
//import { BotFrameworkAdapter } from 'botbuilder';
import { CluBot } from './bot';
import { MemoryStorage, ConversationState, BotFrameworkAdapter } from 'botbuilder'
import * as dotenv from 'dotenv';
dotenv.config();

// Create adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Catch-all error handler
adapter.onTurnError = async (context, error) => {
    console.error(`[onTurnError]: ${error}`);
    console.log('error', error)
    await context.sendActivity("Oops. Something went wrong.");
};

// Create bot
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const bot = new CluBot(conversationState);

// Create server
const server = restify.createServer();
server.listen(process.env.port || 3978, () => {
    console.log(`Bot is listening on port ${server.url}`);
});

// Listen for incoming activities
server.post('/api/messages', async (req, res) => {
   await adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});
