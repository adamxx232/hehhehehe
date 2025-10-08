/**
 * IDPlus - Enhanced Message Utilities for Enmity (iOS)
 * 
 * Features:
 * - Fake messages with custom embeds
 * - Dynamic username fetching
 * - Persistent messages across reloads
 * - Chat freezing
 * - Clipboard & dispatcher rewriting
 * - DM helper utilities
 * 
 * Compatible with: Enmity iOS (Latest)
 */

/* =============================================================================
 * USER CONFIGURATION - EDIT THESE VALUES
 * ===========================================================================*/

// User Settings
const USER_ID = "384837956944527360";        // Your Discord User ID
const USERNAME = "";                          // Leave empty to auto-fetch
const AVATAR_URL = "";                        // Leave empty to auto-fetch

// Message Settings
const TARGET_CHANNEL = "1425577326661603358"; // Target channel ID
const MESSAGE_USER_ID = "1323760789122842735"; // User ID for the message
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
    chatFreezing: true
  },
  
  startDelayMs: 1000,
  
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

/* =============================================================================
 * PLUGIN CODE - DO NOT EDIT BELOW THIS LINE
 * ===========================================================================*/

import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { React } from 'enmity/metro/common';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import { sendReply } from 'enmity/api/clyde';

const Patcher = create('IDPlus');

// Module references
let MessageActions;
let MessageStore;
let ChannelStore;
let UserStore;
let RelationshipStore;
let FluxDispatcher;
let NavigationStack;
let Clipboard;

// State management
const persistentFakeMessages = new Map();
const userInfoCache = new Map();
let isPluginActive = false;

/* =============================================================================
 * UTILITY FUNCTIONS
 * ===========================================================================*/

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const silentError = (msg, err) => {
  // Silent error logging - won't crash the plugin
  if (__DEV__) {
    console.log(`[IDPlus] ${msg}`, err);
  }
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

/* =============================================================================
 * USER INFO FETCHING
 * ===========================================================================*/

async function getUserInfo(userId) {
  if (!userId) return { username: 'Unknown', avatar: null };
  
  // Check cache first
  if (userInfoCache.has(userId)) {
    return userInfoCache.get(userId);
  }

  try {
    // Try UserStore first
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

    // Try RelationshipStore
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

    // Fallback: try to get from any loaded messages
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

/* =============================================================================
 * MESSAGE UTILITIES
 * ===========================================================================*/

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
    
    // Get user info
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

    // Dispatch the message
    FluxDispatcher.dispatch({
      type: 'MESSAGE_CREATE',
      channelId: channelId,
      message: message,
      optimistic: false,
      sendMessageOptions: {},
      isPushNotification: false
    });

    // Store for persistence if enabled
    if (options.persistent && CONFIG.features.persistentMessages) {
      if (!persistentFakeMessages.has(channelId)) {
        persistentFakeMessages.set(channelId, []);
      }
      persistentFakeMessages.get(channelId).push(message);
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

    // Add embed if provided
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

/* =============================================================================
 * AUTO FAKE MESSAGES
 * ===========================================================================*/

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

/* =============================================================================
 * MESSAGE PERSISTENCE
 * ===========================================================================*/

function setupMessagePersistence() {
  if (!CONFIG.features.persistentMessages || !FluxDispatcher) return;

  try {
    // Re-inject persistent messages on MESSAGE_UPDATE or CHANNEL_SELECT
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'CHANNEL_SELECT' || event.type === 'MESSAGE_DELETE') {
        const channelId = event.channelId;
        if (persistentFakeMessages.has(channelId)) {
          setTimeout(() => {
            const messages = persistentFakeMessages.get(channelId);
            messages.forEach(msg => {
              FluxDispatcher.dispatch({
                type: 'MESSAGE_CREATE',
                channelId: channelId,
                message: msg,
                optimistic: false
              });
            });
          }, 100);
        }
      }
    });
  } catch (error) {
    silentError('Failed to setup message persistence', error);
  }
}

/* =============================================================================
 * CHAT FREEZING
 * ===========================================================================*/

function setupChatFreezing() {
  if (!CONFIG.features.chatFreezing || !FluxDispatcher) return;

  try {
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'MESSAGE_CREATE') {
        const channelId = event.channelId || event.message?.channel_id;
        const channel = ChannelStore?.getChannel?.(channelId);
        
        if (channel && channel.type === 1) { // DM channel
          const recipientId = channel.recipients?.[0];
          if (CONFIG.frozenChats.includes(recipientId)) {
            // Block the message from appearing
            return [];
          }
        }
      }
    });
  } catch (error) {
    silentError('Failed to setup chat freezing', error);
  }
}

/* =============================================================================
 * CLIPBOARD PATCHING
 * ===========================================================================*/

async function patchClipboard() {
  if (!CONFIG.features.clipboard) return;

  try {
    Clipboard = await waitForModule(['setString', 'getString']);
    if (!Clipboard) return;

    Patcher.instead(Clipboard, 'setString', (self, args, orig) => {
      let [text] = args;
      
      // Apply ID mapping
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

/* =============================================================================
 * DISPATCHER PATCHING
 * ===========================================================================*/

async function patchDispatcher() {
  if (!CONFIG.features.dispatcher || !FluxDispatcher) return;

  try {
    Patcher.before(FluxDispatcher, 'dispatch', (self, args) => {
      const [event] = args;
      
      if (event.type === 'MESSAGE_CREATE' || event.type === 'MESSAGE_UPDATE') {
        const msg = event.message;
        if (!msg) return;

        // Apply username rules
        CONFIG.usernameRules.forEach(rule => {
          if (rule.matchId && rule.newId && msg.author) {
            if (msg.author.username === rule.matchId) {
              msg.author.username = rule.newId;
            }
          }
        });

        // Apply ID mapping to content
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

/* =============================================================================
 * LINK BUILDER PATCHING
 * ===========================================================================*/

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

/* =============================================================================
 * MODULE INITIALIZATION
 * ===========================================================================*/

async function initializeModules() {
  try {
    MessageActions = await waitForModule(['sendMessage', 'editMessage']);
    MessageStore = await waitForModule(['getMessages', 'getMessage']);
    ChannelStore = await waitForModule(['getChannel', 'getDMFromUserId']);
    UserStore = await waitForModule(['getUser', 'getCurrentUser']);
    RelationshipStore = await waitForModule(['getRelationships']);
    FluxDispatcher = await waitForModule(['dispatch', 'subscribe']);
    
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

/* =============================================================================
 * GLOBAL API
 * ===========================================================================*/

function setupGlobalAPI() {
  window.__MSG_UTILS__ = {
    // Core functions
    injectMessage,
    sendMessage,
    fakeMessage,
    getUserInfo,
    sendAutoFakeMessages,
    
    // Configuration
    getConfig: () => CONFIG,
    
    // Persistent messages
    clearPersistentMessages(channelId) {
      if (channelId) {
        persistentFakeMessages.delete(channelId);
      } else {
        persistentFakeMessages.clear();
      }
    },
    
    getPersistentMessages(channelId) {
      return channelId ? 
        persistentFakeMessages.get(channelId) : 
        Array.from(persistentFakeMessages.entries());
    },
    
    // Chat freezing
    freezeChat(id) {
      if (!CONFIG.frozenChats.includes(id)) {
        CONFIG.frozenChats.push(id);
      }
    },
    
    unfreezeChat(id) {
      const index = CONFIG.frozenChats.indexOf(id);
      if (index > -1) {
        CONFIG.frozenChats.splice(index, 1);
      }
    },
    
    getFrozenChats: () => [...CONFIG.frozenChats],
    isChatFrozen: (id) => CONFIG.frozenChats.includes(id),
    
    // Testing
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
    
    // Cache management
    clearUserCache() {
      userInfoCache.clear();
    },
    
    getCachedUserInfo(userId) {
      return userInfoCache.get(userId);
    },
    
    // Plugin status
    getPluginStatus() {
      return {
        isActive: isPluginActive,
        modules: {
          MessageActions: !!MessageActions,
          MessageStore: !!MessageStore,
          ChannelStore: !!ChannelStore,
          UserStore: !!UserStore,
          FluxDispatcher: !!FluxDispatcher
        },
        features: CONFIG.features,
        persistentMessageCount: persistentFakeMessages.size,
        frozenChatsCount: CONFIG.frozenChats.length
      };
    },
    
    // Quick message
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

/* =============================================================================
 * PLUGIN LIFECYCLE
 * ===========================================================================*/

const IDPlus: Plugin = {
  name: 'IDPlus',
  version: '2.0.0',
  description: 'Enhanced message utilities with fake messages, embeds, and more',
  authors: [
    {
      name: 'IDPlus Team',
      id: '0'
    }
  ],

  async onStart() {
    try {
      isPluginActive = true;
      
      // Wait for initialization delay
      if (CONFIG.startDelayMs > 0) {
        await delay(CONFIG.startDelayMs);
      }

      // Initialize all Discord modules
      const modulesReady = await initializeModules();
      if (!modulesReady) {
        sendReply('❌ IDPlus failed to initialize (missing modules)');
        return;
      }

      // Setup global API
      setupGlobalAPI();

      // Apply patches
      await patchClipboard();
      await patchDispatcher();
      await patchLinkBuilders();
      
      // Setup features
      setupMessagePersistence();
      setupChatFreezing();

      // Send auto fake messages
      if (CONFIG.features.autoFakeMessages) {
        setTimeout(() => {
          sendAutoFakeMessages();
        }, 500);
      }

      sendReply('✅ IDPlus started successfully! Use `window.__MSG_UTILS__` for API access.');
      
    } catch (error) {
      silentError('Plugin start failed', error);
      sendReply('❌ IDPlus encountered an error during startup');
    }
  },

  onStop() {
    try {
      isPluginActive = false;
      Patcher.unpatchAll();
      persistentFakeMessages.clear();
      userInfoCache.clear();
      
      if (window.__MSG_UTILS__) {
        delete window.__MSG_UTILS__;
      }
      
      sendReply('👋 IDPlus stopped');
    } catch (error) {
      silentError('Plugin stop failed', error);
    }
  }
};

registerPlugin(IDPlus);

