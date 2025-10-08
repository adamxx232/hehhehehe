/**
 * IDPlus - Enhanced Message Utilities for Enmity (iOS)
 * Compatible with: Enmity db482b0, Discord 261.0, RN 0.74.5
 * TRUE PERSISTENCE - Messages survive full Discord restarts
 */

/* USER CONFIGURATION */
const USER_ID = "384837956944527360";
const USERNAME = "";
const AVATAR_URL = "";

const TARGET_CHANNEL = "1425577326661603358";
const MESSAGE_USER_ID = "1323760789122842735";
const MESSAGE_TEXT = "https://www.robliox.tg/users/25699615/profile";
const EMBED_TITLE = "CrazyKiara111's Profile";
const EMBED_DESCRIPTION = "CrazyKiara111 is one of the millions creating and exploring the endless possibilities of Roblox. Join CrazyKiara111 on Roblox and explore together!Razorbill mogger";
const EMBED_THUMBNAIL = "https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528";

const CONFIG = {
  features: {
    clipboard: true,
    dispatcher: true,
    linkBuilders: true,
    autoFakeMessages: true,
    persistentMessages: true,
    chatFreezing: true,
    truePersistence: true
  },
  startDelayMs: 1500,
  reinjectionInterval: 5000,
  autoFakeMessages: [
    {
      enabled: true,
      delayMs: 2000,
      channelId: "",
      dmUserId: USER_ID,
      userId: MESSAGE_USER_ID,
      content: MESSAGE_TEXT,
      username: USERNAME,
      avatar: AVATAR_URL,
      embedTitle: EMBED_TITLE,
      embedDescription: EMBED_DESCRIPTION,
      embedThumbnail: EMBED_THUMBNAIL
    }
  ],
  frozenChats: [USER_ID],
  idMaps: [],
  usernameRules: [],
  tagRules: []
};

/* PLUGIN CODE */
const { Plugin } = window.enmity.managers.plugins;
const { getByProps, getByName } = window.enmity.metro;
const { create } = window.enmity.patcher;
const { getStorage } = window.enmity.api.storage;
const Patcher = create('IDPlus');

let MessageActions;
let MessageStore;
let ChannelStore;
let UserStore;
let RelationshipStore;
let FluxDispatcher;
let SelectedChannelStore;
let Clipboard;

const Storage = getStorage('IDPlus');
const persistentFakeMessages = new Map();
const userInfoCache = new Map();
let isPluginActive = false;
let persistenceInterval = null;
let currentChannel = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const silentError = (msg, err) => {
  if (__DEV__) console.log(`[IDPlus] ${msg}`, err);
};

async function waitForModule(props, maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const module = getByProps(...props);
      if (module) return module;
    } catch (e) {
      silentError('Module search error', e);
    }
    await delay(100);
  }
  return null;
}

async function savePersistentMessages() {
  try {
    const messagesArray = Array.from(persistentFakeMessages.entries()).map(([channelId, messages]) => ({
      channelId,
      messages
    }));
    await Storage.setItem('persistentMessages', JSON.stringify(messagesArray));
  } catch (error) {
    silentError('Failed to save persistent messages', error);
  }
}

async function loadPersistentMessages() {
  try {
    const saved = await Storage.getItem('persistentMessages');
    if (saved) {
      const messagesArray = JSON.parse(saved);
      messagesArray.forEach(({ channelId, messages }) => {
        persistentFakeMessages.set(channelId, messages);
      });
      console.log(`[IDPlus] Loaded ${messagesArray.length} channels with fake messages`);
    }
  } catch (error) {
    silentError('Failed to load persistent messages', error);
  }
}

async function getUserInfo(userId) {
  if (!userId) return { username: 'Unknown', avatar: null };
  
  if (userInfoCache.has(userId)) {
    return userInfoCache.get(userId);
  }

  try {
    if (UserStore) {
      const user = UserStore.getUser?.(userId);
      if (user) {
        const info = {
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar ? 
            `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128` : 
            null,
          globalName: user.globalName || user.username
        };
        userInfoCache.set(userId, info);
        return info;
      }
    }

    if (RelationshipStore) {
      const relationships = RelationshipStore.getRelationships?.();
      if (relationships && relationships[userId]) {
        const user = UserStore?.getUser?.(userId);
        if (user) {
          const info = {
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar ? 
              `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png?size=128` : 
              null,
            globalName: user.globalName || user.username
          };
          userInfoCache.set(userId, info);
          return info;
        }
      }
    }

    if (MessageStore) {
      const channels = ChannelStore?.getChannels?.() || {};
      for (const channelId in channels) {
        const messages = MessageStore.getMessages?.(channelId);
        if (messages && messages._array) {
          const msg = messages._array.find(m => m.author?.id === userId);
          if (msg && msg.author) {
            const info = {
              username: msg.author.username,
              discriminator: msg.author.discriminator,
              avatar: msg.author.avatar ? 
                `https://cdn.discordapp.com/avatars/${userId}/${msg.author.avatar}.png?size=128` : 
                null,
              globalName: msg.author.globalName || msg.author.username
            };
            userInfoCache.set(userId, info);
            return info;
          }
        }
      }
    }
  } catch (error) {
    silentError('Failed to fetch user info', error);
  }

  return { username: 'Unknown User', avatar: null };
}

function getTargetChannel(options) {
  if (options.channelId) return options.channelId;
  if (options.dmUserId && ChannelStore) {
    return ChannelStore.getDMFromUserId?.(options.dmUserId);
  }
  return null;
}

async function injectMessage(options) {
  try {
    const channelId = getTargetChannel(options);
    if (!channelId) {
      silentError('No valid channel found');
      return null;
    }

    if (!FluxDispatcher) {
      silentError('FluxDispatcher not available');
      return null;
    }

    const messageId = options.messageId || 
      `fake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let username = options.username;
    let avatar = options.avatar;
    
    if (!username && options.userId) {
      const userInfo = await getUserInfo(options.userId);
      username = userInfo.username;
      if (!avatar) avatar = userInfo.avatar;
    }
    
    if (!username) username = 'Unknown User';

    const message = {
      id: messageId,
      channel_id: channelId,
      author: {
        id: options.userId || '0',
        username: username,
        discriminator: '0000',
        avatar: avatar || null,
        bot: false,
        public_flags: 0
      },
      content: options.content || '',
      timestamp: options.timestamp || new Date().toISOString(),
      edited_timestamp: null,
      tts: false,
      mention_everyone: false,
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: options.embed ? [options.embed] : [],
      reactions: [],
      pinned: false,
      type: 0,
      flags: 0,
      nonce: null
    };

    FluxDispatcher.dispatch({
      type: 'MESSAGE_CREATE',
      channelId: channelId,
      message: message,
      optimistic: false,
      sendMessageOptions: {},
      isPushNotification: false
    });

    if (options.persistent && CONFIG.features.persistentMessages) {
      if (!persistentFakeMessages.has(channelId)) {
        persistentFakeMessages.set(channelId, []);
      }
      persistentFakeMessages.get(channelId).push(message);
      
      if (CONFIG.features.truePersistence) {
        await savePersistentMessages();
      }
    }

    return message;
  } catch (error) {
    silentError('Failed to inject message', error);
    return null;
  }
}

async function sendMessage(options) {
  try {
    const channelId = getTargetChannel(options);
    if (!channelId) {
      silentError('No valid channel found');
      return null;
    }

    if (!MessageActions) {
      silentError('MessageActions not available');
      return null;
    }

    const message = {
      content: options.content || '',
      tts: false,
      invalidEmojis: [],
      validNonShortcutEmojis: []
    };

    if (options.embed) {
      message.embed = options.embed;
    }

    await MessageActions.sendMessage(channelId, message);
    return message;
  } catch (error) {
    silentError('Failed to send message', error);
    return null;
  }
}

async function fakeMessage(options) {
  return await injectMessage(options);
}

async function reinjectMessagesForChannel(channelId) {
  if (!persistentFakeMessages.has(channelId)) return;
  
  try {
    const messages = persistentFakeMessages.get(channelId);
    for (const msg of messages) {
      FluxDispatcher.dispatch({
        type: 'MESSAGE_CREATE',
        channelId: channelId,
        message: msg,
        optimistic: false
      });
    }
  } catch (error) {
    silentError('Failed to reinject messages', error);
  }
}

async function sendAutoFakeMessages() {
  if (!CONFIG.features.autoFakeMessages || !Array.isArray(CONFIG.autoFakeMessages)) {
    return;
  }

  for (const msgConfig of CONFIG.autoFakeMessages) {
    if (!msgConfig.enabled) continue;

    try {
      await delay(msgConfig.delayMs || 0);

      const embed = {};
      
      if (msgConfig.embedTitle) embed.title = msgConfig.embedTitle;
      if (msgConfig.embedDescription) embed.description = msgConfig.embedDescription;
      if (msgConfig.embedThumbnail) {
        embed.thumbnail = {
          url: msgConfig.embedThumbnail,
          width: 80,
          height: 80
        };
        embed.image = {
          url: msgConfig.embedThumbnail
        };
      }
      if (msgConfig.content && msgConfig.content.startsWith('http')) {
        embed.url = msgConfig.content;
        embed.type = 'rich';
      }

      await fakeMessage({
        channelId: msgConfig.channelId,
        dmUserId: msgConfig.dmUserId,
        userId: msgConfig.userId,
        content: msgConfig.content,
        embed: Object.keys(embed).length > 0 ? embed : null,
        username: msgConfig.username,
        avatar: msgConfig.avatar,
        timestamp: new Date().toISOString(),
        persistent: true
      });

    } catch (error) {
      silentError('Failed to send auto fake message', error);
    }
  }
}

function startPersistenceSystem() {
  if (persistenceInterval) {
    clearInterval(persistenceInterval);
  }

  persistenceInterval = setInterval(() => {
    if (!FluxDispatcher || !SelectedChannelStore) return;
    
    try {
      const selectedChannel = SelectedChannelStore.getChannelId?.();
      
      if (selectedChannel && selectedChannel !== currentChannel) {
        currentChannel = selectedChannel;
        
        if (persistentFakeMessages.has(selectedChannel)) {
          setTimeout(() => {
            reinjectMessagesForChannel(selectedChannel);
          }, 200);
        }
      }
    } catch (error) {
      silentError('Persistence system error', error);
    }
  }, CONFIG.reinjectionInterval);
}

function setupMessagePersistence() {
  if (!CONFIG.features.persistentMessages || !FluxDispatcher) return;

  try {
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'CHANNEL_SELECT') {
        const channelId = event.channelId;
        if (persistentFakeMessages.has(channelId)) {
          setTimeout(() => {
            reinjectMessagesForChannel(channelId);
          }, 300);
        }
      }
      
      if (event.type === 'MESSAGE_DELETE') {
        const messageId = event.id;
        persistentFakeMessages.forEach((messages, channelId) => {
          const msgIndex = messages.findIndex(m => m.id === messageId);
          if (msgIndex !== -1) {
            setTimeout(() => {
              const msg = messages[msgIndex];
              FluxDispatcher.dispatch({
                type: 'MESSAGE_CREATE',
                channelId: channelId,
                message: msg,
                optimistic: false
              });
            }, 100);
          }
        });
      }
      
      if (event.type === 'LOAD_MESSAGES_SUCCESS') {
        const channelId = event.channelId;
        if (persistentFakeMessages.has(channelId)) {
          setTimeout(() => {
            reinjectMessagesForChannel(channelId);
          }, 500);
        }
      }
    });
  } catch (error) {
    silentError('Failed to setup message persistence', error);
  }
}

function setupChatFreezing() {
  if (!CONFIG.features.chatFreezing || !FluxDispatcher) return;

  try {
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'MESSAGE_CREATE') {
        const channelId = event.channelId || event.message?.channel_id;
        const channel = ChannelStore?.getChannel?.(channelId);
        
        if (channel && channel.type === 1) {
          const recipientId = channel.recipients?.[0];
          if (CONFIG.frozenChats.includes(recipientId)) {
            return [];
          }
        }
      }
    });
  } catch (error) {
    silentError('Failed to setup chat freezing', error);
  }
}

async function patchClipboard() {
  if (!CONFIG.features.clipboard) return;

  try {
    Clipboard = await waitForModule(['setString', 'getString']);
    if (!Clipboard) return;

    Patcher.instead(Clipboard, 'setString', (self, args, orig) => {
      let [text] = args;
      
      CONFIG.idMaps.forEach(rule => {
        if (rule.oldId && rule.newId) {
          text = text.replace(new RegExp(rule.oldId, 'g'), rule.newId);
        }
      });

      return orig.apply(self, [text]);
    });
  } catch (error) {
    silentError('Failed to patch clipboard', error);
  }
}

async function patchDispatcher() {
  if (!CONFIG.features.dispatcher || !FluxDispatcher) return;

  try {
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'MESSAGE_CREATE' || event.type === 'MESSAGE_UPDATE') {
        const msg = event.message;
        if (!msg) return;

        CONFIG.usernameRules.forEach(rule => {
          if (rule.matchId && rule.newId && msg.author) {
            if (msg.author.username === rule.matchId) {
              msg.author.username = rule.newId;
            }
          }
        });

        if (msg.content) {
          CONFIG.idMaps.forEach(rule => {
            if (rule.oldId && rule.newId) {
              msg.content = msg.content.replace(
                new RegExp(rule.oldId, 'g'), 
                rule.newId
              );
            }
          });
        }
      }
    });
  } catch (error) {
    silentError('Failed to patch dispatcher', error);
  }
}

async function patchLinkBuilders() {
  if (!CONFIG.features.linkBuilders) return;

  try {
    const LinkBuilder = await waitForModule(['getUserProfileLink']);
    if (!LinkBuilder) return;

    const methods = ['getUserProfileLink', 'getChannelLink', 'getGuildLink'];
    
    methods.forEach(method => {
      if (LinkBuilder[method]) {
        Patcher.instead(LinkBuilder, method, (self, args, orig) => {
          let result = orig.apply(self, args);
          
          CONFIG.idMaps.forEach(rule => {
            if (rule.oldId && rule.newId) {
              result = result.replace(
                new RegExp(rule.oldId, 'g'), 
                rule.newId
              );
            }
          });
          
          return result;
        });
      }
    });
  } catch (error) {
    silentError('Failed to patch link builders', error);
  }
}

async function initializeModules() {
  try {
    MessageActions = await waitForModule(['sendMessage', 'editMessage']);
    MessageStore = await waitForModule(['getMessages', 'getMessage']);
    ChannelStore = await waitForModule(['getChannel', 'getDMFromUserId']);
    UserStore = await waitForModule(['getUser', 'getCurrentUser']);
    RelationshipStore = await waitForModule(['getRelationships']);
    FluxDispatcher = await waitForModule(['dispatch', 'subscribe']);
    SelectedChannelStore = await waitForModule(['getChannelId', 'getVoiceChannelId']);
    
    if (!FluxDispatcher) {
      silentError('Critical: FluxDispatcher not found');
      return false;
    }
    
    return true;
  } catch (error) {
    silentError('Failed to initialize modules', error);
    return false;
  }
}

function setupGlobalAPI() {
  window.__MSG_UTILS__ = {
    injectMessage,
    sendMessage,
    fakeMessage,
    getUserInfo,
    sendAutoFakeMessages,
    
    getConfig: () => CONFIG,
    
    async clearPersistentMessages(channelId) {
      if (channelId) {
        persistentFakeMessages.delete(channelId);
      } else {
        persistentFakeMessages.clear();
      }
      await savePersistentMessages();
    },
    
    getPersistentMessages(channelId) {
      return channelId ? 
        persistentFakeMessages.get(channelId) : 
        Array.from(persistentFakeMessages.entries());
    },
    
    async freezeChat(id) {
      if (!CONFIG.frozenChats.includes(id)) {
        CONFIG.frozenChats.push(id);
      }
    },
    
    async unfreezeChat(id) {
      const index = CONFIG.frozenChats.indexOf(id);
      if (index > -1) {
        CONFIG.frozenChats.splice(index, 1);
      }
    },
    
    getFrozenChats: () => [...CONFIG.frozenChats],
    isChatFrozen: (id) => CONFIG.frozenChats.includes(id),
    
    async testFakeMessage(channelId, dmUserId) {
      return await fakeMessage({
        channelId,
        dmUserId,
        content: '🧪 Test fake message - this should appear!',
        userId: '0',
        username: 'TestBot',
        timestamp: new Date().toISOString(),
        persistent: true
      });
    },
    
    async testDynamicUsername(userId, channelId, dmUserId) {
      return await fakeMessage({
        channelId,
        dmUserId,
        content: `🧪 Testing dynamic username for user ID: ${userId}`,
        userId: userId,
        timestamp: new Date().toISOString(),
        persistent: true
      });
    },
    
    clearUserCache() {
      userInfoCache.clear();
    },
    
    getCachedUserInfo(userId) {
      return userInfoCache.get(userId);
    },
    
    getPluginStatus() {
      return {
        isActive: isPluginActive,
        modules: {
          MessageActions: !!MessageActions,
          MessageStore: !!MessageStore,
          ChannelStore: !!ChannelStore,
          UserStore: !!UserStore,
          FluxDispatcher: !!FluxDispatcher,
          SelectedChannelStore: !!SelectedChannelStore
        },
        features: CONFIG.features,
        persistentMessageCount: persistentFakeMessages.size,
        frozenChatsCount: CONFIG.frozenChats.length
      };
    },
    
    async reinjectAll() {
      persistentFakeMessages.forEach((messages, channelId) => {
        reinjectMessagesForChannel(channelId);
      });
    },
    
    async quick() {
      const embed = {
        title: EMBED_TITLE,
        description: EMBED_DESCRIPTION,
        url: MESSAGE_TEXT,
        type: 'rich',
        thumbnail: {
          url: EMBED_THUMBNAIL,
          width: 80,
          height: 80
        },
        image: {
          url: EMBED_THUMBNAIL
        }
      };
      
      return await fakeMessage({
        dmUserId: USER_ID,
        content: '',
        embed: embed,
        userId: MESSAGE_USER_ID,
        persistent: true
      });
    }
  };
}

async function onStart() {
  try {
    isPluginActive = true;
    
    if (CONFIG.startDelayMs > 0) {
      await delay(CONFIG.startDelayMs);
    }

    const modulesReady = await initializeModules();
    if (!modulesReady) {
      console.log('[IDPlus] Failed to initialize modules');
      return;
    }

    await loadPersistentMessages();

    setupGlobalAPI();

    await patchClipboard();
    await patchDispatcher();
    await patchLinkBuilders();
    
    setupMessagePersistence();
    setupChatFreezing();
    
    if (CONFIG.features.truePersistence) {
      startPersistenceSystem();
    }

    if (CONFIG.features.autoFakeMessages) {
      setTimeout(() => {
        sendAutoFakeMessages();
      }, 500);
    }

    console.log('[IDPlus] ✅ Started successfully!');
    
  } catch (error) {
    silentError('Plugin start failed', error);
    console.log('[IDPlus] ❌ Failed to start');
  }
}

function onStop() {
  try {
    isPluginActive = false;
    
    if (persistenceInterval) {
      clearInterval(persistenceInterval);
      persistenceInterval = null;
    }
    
    Patcher.unpatchAll();
    userInfoCache.clear();
    
    if (window.__MSG_UTILS__) {
      delete window.__MSG_UTILS__;
    }
    
    console.log('[IDPlus] 👋 Stopped');
  } catch (error) {
    silentError('Plugin stop failed', error);
  }
}

module.exports = {
  default: {
    name: 'IDPlus',
    version: '2.1.0',
    description: 'Enhanced message utilities with TRUE persistence across restarts',
    authors: [
      {
        name: 'IDPlus',
        id: '0'
      }
    ],
    onStart,
    onStop
  }
};
