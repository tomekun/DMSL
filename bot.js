import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActivityType } from 'discord.js';
import { status, statusBedrock } from 'minecraft-server-util';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config();

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// サーバープロセスを管理するオブジェクト
const serverProcesses = {
    java: null,
    bedrock: null
};

// 監視タスクを管理するオブジェクト
const monitoringTasks = {
    java: null,
    bedrock: null
};

/**
 * Botのステータス（アクティビティ）を更新する関数
 */
function updateBotStatus() {
    const beStatus = serverProcesses.bedrock ? '🟢' : '⚫';
    const jeStatus = serverProcesses.java ? '🟢' : '⚫';

    // カスタムステータスとして設定
    client.user.setActivity({
        name: `BE: ${beStatus} | JE: ${jeStatus}`,
        type: ActivityType.Custom
    });
}

client.once('clientReady', () => {
    console.log(`✅ Botが起動しました: ${client.user.tag}`);
    console.log('コマンド: BEstop = 統合版停止, JEstop = Java版停止');
    updateBotStatus(); // 初期ステータスを設定
});

// コンソール入力を受け付ける設定
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// コンソールからの入力を処理
rl.on('line', (input) => {
    const command = input.trim();

    if (command === 'BEstop') {
        stopServer('bedrock', '統合版');
    } else if (command === 'JEstop') {
        stopServer('java', 'Java版');
    }
});

/**
 * サーバーを停止する関数
 */
function stopServer(serverType, serverName) {
    if (serverProcesses[serverType] === null) {
        console.log(`❌ ${serverName}サーバーは起動していません`);
        return;
    }

    console.log(`🛑 ${serverName}サーバーを停止しています...`);

    // 監視タスクをクリア
    if (monitoringTasks[serverType]) {
        clearInterval(monitoringTasks[serverType]);
        monitoringTasks[serverType] = null;
    }

    // サーバープロセスを終了
    if (serverProcesses[serverType]) {
        // Windowsの場合はtaskkillを使用
        if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', serverProcesses[serverType].pid, '/f', '/t']);
        } else {
            serverProcesses[serverType].kill();
        }

        serverProcesses[serverType] = null;
        updateBotStatus(); // ステータスを更新
        console.log(`✅ ${serverName}サーバーを停止しました`);
    }
}

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'server') {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('bedrock')
                        .setLabel('統合版')
                        .setStyle(ButtonStyle.Success), // 緑色
                    new ButtonBuilder()
                        .setCustomId('java')
                        .setLabel('Java')
                        .setStyle(ButtonStyle.Danger) // 赤色
                );

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🎮 サーバー起動用ボタン')
                .setDescription('起動したいサーバーのボタンを押してください\n\n⚠️ プレイヤーが10分間不在の場合、自動で閉じます');

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    if (interaction.isButton()) {
        const serverType = interaction.customId; // 'java' or 'bedrock'
        await interaction.deferReply();

        // 既にサーバーが起動している場合
        if (serverProcesses[serverType] !== null) {
            await interaction.editReply('❌ このサーバーは既に起動しています');
            return;
        }

        // サーバー設定を取得
        const serverConfig = serverType === 'java' ? config.javaServer : config.bedrockServer;
        const serverName = serverType === 'java' ? 'Java版' : '統合版';

        try {
            // サーバープロセスを起動
            console.log(`${serverName}サーバーを起動中: ${serverConfig.command}`);

            // 作業ディレクトリを取得（サーバーの設定ファイル等が必要なため）
            const commandPath = serverConfig.command;
            const lastSlashIndex = Math.max(commandPath.lastIndexOf('\\'), commandPath.lastIndexOf('/'));
            const workingDirectory = lastSlashIndex > 0 ? commandPath.substring(0, lastSlashIndex) : '.';

            console.log(`作業ディレクトリ: ${workingDirectory}`);

            const serverProcess = spawn(commandPath, [], {
                shell: true,
                detached: false,
                cwd: workingDirectory  // 作業ディレクトリを設定
            });

            serverProcesses[serverType] = serverProcess;
            updateBotStatus(); // 起動時にステータス更新

            // プロセスの標準出力をログに出力
            serverProcess.stdout?.on('data', (data) => {
                console.log(`[${serverName}] ${data}`);
            });

            serverProcess.stderr?.on('data', (data) => {
                console.error(`[${serverName} ERROR] ${data}`);
            });

            // プロセスが終了した時の処理
            serverProcess.on('exit', (code) => {
                console.log(`${serverName}サーバーが終了しました (コード: ${code})`);
                serverProcesses[serverType] = null;
                updateBotStatus(); // 終了時にステータス更新

                // 監視タスクをクリア
                if (monitoringTasks[serverType]) {
                    clearInterval(monitoringTasks[serverType]);
                    monitoringTasks[serverType] = null;
                }
            });

            // 起動成功を待つ（3秒待機）
            await new Promise(resolve => setTimeout(resolve, 3000));

            // プロセスがまだ生きているか確認
            if (serverProcess.exitCode === null) {
                await interaction.editReply(`✅ ${serverName}サーバーの起動に成功しました！`);

                // プレイヤー監視タスクを開始
                startPlayerMonitoring(serverType, serverConfig, interaction.channel);
            } else {
                await interaction.editReply(`❌ ${serverName}サーバーの起動に失敗しました`);
                serverProcesses[serverType] = null;
                updateBotStatus(); // 失敗時にステータス更新
            }

        } catch (error) {
            console.error('サーバー起動エラー:', error);
            await interaction.editReply(`❌ ${serverName}サーバーの起動に失敗しました: ${error.message}`);
            serverProcesses[serverType] = null;
            updateBotStatus(); // エラー時にステータス更新
        }
    }
});



/**
 * プレイヤー数を監視し、0人の場合にサーバーを終了する
 */
function startPlayerMonitoring(serverType, serverConfig, channel) {
    const serverName = serverType === 'java' ? 'Java版' : '統合版';
    const checkInterval = config.checkIntervalMinutes * 60 * 1000; // 分をミリ秒に変換
    const initialDelay = 120000; // サーバー起動後、最初のチェックまで60秒待機

    console.log(`${serverName}のプレイヤー監視を開始します (${config.checkIntervalMinutes}分間隔、初回チェックは120秒後)`);

    // 最初のチェックまで待機してから定期チェックを開始
    setTimeout(() => {
        // 定期的なプレイヤー数チェックを実行
        monitoringTasks[serverType] = setInterval(async () => {
            try {
                // サーバーの種類に応じて適切なステータス関数を使用
                const statusFunction = serverType === 'java' ? status : statusBedrock;

                // ローカルホストでMinecraftサーバーのステータスを取得
                const response = await statusFunction('localhost', serverConfig.port, {
                    timeout: 5000,
                    enableSRV: false
                });

                const playerCount = response.players.online;
                console.log(`[${serverName}] プレイヤー数: ${playerCount}/${response.players.max}`);

                if (playerCount === 0) {
                    console.log(`${serverName}にプレイヤーがいないため、サーバーを終了します`);

                    // 監視タスクをクリア
                    clearInterval(monitoringTasks[serverType]);
                    monitoringTasks[serverType] = null;

                    // サーバープロセスを終了
                    if (serverProcesses[serverType]) {
                        // Windowsの場合はtaskkillを使用
                        if (process.platform === 'win32') {
                            spawn('taskkill', ['/pid', serverProcesses[serverType].pid, '/f', '/t']);
                        } else {
                            serverProcesses[serverType].kill();
                        }

                        serverProcesses[serverType] = null;
                        updateBotStatus();
                    }

                    // Discordに通知
                    if (channel) {
                        await channel.send(`🛑 ${serverName}サーバーはプレイヤー不在のため自動で停止しました`);
                    }
                }

            } catch (error) {
                console.error(`[${serverName}] ステータス取得エラー: ${error.message}`);
                console.error(`エラーの詳細:`, error);
                // エラーが発生してもサーバーは停止しない（サーバーが起動中の可能性があるため）
            }
        }, checkInterval);
    }, initialDelay);
}

client.login(process.env.DISCORD_BOT_TOKEN);
