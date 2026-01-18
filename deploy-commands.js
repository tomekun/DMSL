import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
    new SlashCommandBuilder()
        .setName('server')
        .setDescription('Minecraftサーバーを起動します')
        .toJSON(),
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log('スラッシュコマンドをグローバルに登録しています...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log('✅ スラッシュコマンドの登録が完了しました！');
        console.log('⏰ グローバルコマンドは反映まで最大1時間かかる場合があります');
    } catch (error) {
        console.error('❌ エラーが発生しました:', error);
    }
})();
