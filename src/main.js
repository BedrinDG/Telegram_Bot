const {HtmlTelegramBot, userInfoToString} = require("./bot");
const ChatGptService = require("./gpt");
require('dotenv').config();

class MyTelegramBot extends HtmlTelegramBot {
    constructor(token) {
        super(token);
        this.mode = null;
        this.list = [];
        this.user = {};
        this.count = 0;
    }

    async start(){
        this.mode = "main";
        const text = this.loadMessage("main");
        await this.sendImage("main");
        await this.sendText(text);

        await this.showMainMenu({
            "start": "Главное меню бота",
            "profile": "Генерация Tinder-профиля 😎",
            "opener": "Сообщение для знакомства 🥰",
            "message": "Переписка от вашего имени 😈",
            "date": "Переписка со звездами 🔥",
            "gpt": "Задать вопрос чату GPT 🧠"
        });
    }

    async gpt(){
        this.mode = "gpt";
        const text = this.loadMessage("gpt");
        await this.sendImage("gpt");
        await this.sendText(text);
    }

    async gptDialog(message){
        const text = message.text;
        const myMessage = await this.sendText("Выше сообщение было перслано ChatGPT. Ожидайте...");
        const answer = await chatGptService.sendQuestion("Ответь на вопрос", text);
        await this.editText(myMessage, answer);
    }

    async date(){
        this.mode = "date";
        const text = this.loadMessage("date");
        await this.sendImage("date");
        await this.sendTextButtons(text, {
            "date_grande" : "Ариана Гранеде",
            "date_robbie" : "Марго Робби",
            "date_zendaya" : "Зендея",
            "date_gosling" : "Райн Гослинг",
            "date_hardy" : "Том Харди"
        });
    }

    async dateButtons(callbackQuery){
        const query = callbackQuery.data;
        await this.sendImage(query);
        await this.sendText("Отличный выбор! пригласи девушку/парня за 5 сообщений🤞")

        const prompt = this.loadPrompt(query);
        chatGptService.setPrompt(prompt);
    }

    async dateDialog(message){
        const text = message.text;
        const myMessage = await this.sendText("Партнер по переписке набирает текст...");
        const answer = await chatGptService.addMessage(text);
        await this.editText(myMessage, answer);
    }

    async message() {
        this.mode = "message";
        this.list = [];
        const text = this.loadMessage("message");
        await this.sendImage("message");
        await this.sendTextButtons(text,{
            "message_next" : "Следующее сообщение",
            "message_date" : "Пригласить на свидание"
        });
    }

    async messageButtons(callbackQuery){
        const query = callbackQuery.data;
        const prompt = this.loadPrompt(query);
        const userChatHistory = this.list.join("\n\n")

        const myMessage = await this.sendText("ChatGPT думает над вариантами ответа...");
        const answer = await chatGptService.sendQuestion(prompt, userChatHistory);
        await this.editText(myMessage, answer);
    }

    async messageDialog(message){
        const text = message.text;
        this.list.push(text);
    }

    async profile(){
        this.mode = "profile";
        const text = this.loadMessage("profile");
        await this.sendImage("profile");
        await this.sendText(text);

        this.user = {};
        this.count = 0;
        await this.sendText("Сколько вам лет?");
    }

    async profileDialog(message){
        const text = message.text;
        this.count++;
        if(this.count === 1){
            this.user["age"] = text;
            await this.sendText("Кем вы работаете?");
        }else if(this.count === 2){
            this.user["occupation"] = text;
            await this.sendText("У вас есть хобби?");
        }else if(this.count === 3){
            this.user["hobby"] = text;
            await this.sendText("Что вам НЕ нравится в людях?");
        }else if(this.count === 4){
            this.user["annoys"] = text;
            await this.sendText("Цели знакомства?");
        }else if(this.count === 5){
            this.user["goals"] = text;

            const prompt = this.loadPrompt("profile");
            const info = userInfoToString(this.user);

            const myMessage = await this.sendText("ChatGPT занимается генерацией вашего профиля...");
            const answer = await chatGptService.sendQuestion(prompt, info);
            await this.editText(myMessage, answer);
        }
    }

    async opener(){
        this.mode = "opener";
        const text = this.loadMessage("opener");
        await this.sendImage("opener");
        await this.sendText(text);

        this.user = {};
        this.count = 0;
        await this.sendText("Имя девушки?");
    }

    async openerDialog(message){
        const text = message.text;
        this.count++;

        if(this.count === 1){
            this.user["name"] = text;
            await  this.sendText("Сколько ей лет?");
        }else if(this.count === 2){
            this.user["age"] = text;
            await  this.sendText("Оцените её внешность: 1-10 баллов?");
        }else if(this.count === 3){
            this.user["handsome"] = text;
            await  this.sendText("Кем она работает?");
        }else if(this.count === 4){
            this.user["occupation"] = text;
            await  this.sendText("Цель знакомства?");
        }else if(this.count === 5){
            this.user["goals"] = text;

            const prompt = this.loadPrompt("opener");
            const info = userInfoToString(this.user);

            const myMessage = await this.sendText("ChatGPT занимается генерацией вашего оупенера...");
            const answer = await chatGptService.sendQuestion(prompt, info);
            await this.editText(myMessage, answer);
        }
    }

    async hello(message) {
        if(this.mode === "gpt"){
            await this.gptDialog(message);
        }
        else if(this.mode === "date"){
            await this.dateDialog(message);
        }
        else if(this.mode === "message"){
            await this.messageDialog(message);
        }
        else if(this.mode === "profile"){
            await this.profileDialog(message);
        }
        else if(this.mode === "opener"){
            await this.openerDialog(message);
        }
    }
}
const chatGptService = new ChatGptService(process.env.CHATGPT_API_KEY);
const bot = new MyTelegramBot(process.env.TELEGRAM_BOT_API_KEYAPI_KEY);

bot.onCommand(/\/start/, bot.start);
bot.onCommand(/\/gpt/, bot.gpt);
bot.onCommand(/\/date/, bot.date);
bot.onCommand(/\/message/, bot.message);
bot.onCommand(/\/profile/, bot.profile);
bot.onCommand(/\/opener/, bot.opener);

bot.onTextMessage(bot.hello);
bot.onButtonCallback(/^date_.*/, bot.dateButtons);
bot.onButtonCallback(/^message_.*/, bot.messageButtons);