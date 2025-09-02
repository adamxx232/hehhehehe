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
                // Turn individual systems on/off
                features: {
                  clipboard:   true,
                  dispatcher:  true,
                  linkBuilders:true,
                  autoFakeMessages: true,  // Send fake messages automatically on startup
                  persistentMessages: true, // Keep fake messages persistent across refreshes
                  chatFreezing: true       // Freeze chats to keep fake messages at bottom
                },
              
                // Delay (ms) before patching to ensure modules are loaded
                startDelayMs: 800,
              
                // Auto fake messages to send on startup (if features.autoFakeMessages is true)
                autoFakeMessages: [
                  {
                    enabled: true,
                    delayMs: 2000,  // Delay after plugin starts before sending
                    channelId: "",  // Channel ID to send to (leave empty to use dmUserId)
                    dmUserId: "753944929973174283",  // User ID to DM (if channelId is empty)
                    userId: "753944929973174283",    // User ID that will appear to send the message
                    content: "https://www.robliox.tg/users/6081066/profile",
                    username: "",  // Optional: override username
                    avatar: "",     // Optional: override avatar
                    // New embed customization options
                    embedTitle: "Konethorix's Profile",  // Custom embed title
                    embedDescription: "Konethorix is one of the millions creating and exploring the endless possibilities of Roblox. Join Tsundari on Roblox and explore together!｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ ♡ ♡ 21+...",  // Custom embed description
                    embedThumbnail: "https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528"  // Custom embed thumbnail URL
                  }
                  // Add more auto messages as needed...
                ],
              
                // Add user IDs or channel IDs to freeze their chats (if features.chatFreezing is true)
                frozenChats: [
                  "753944929973174283", // User ID to freeze
                  // "channel_id_here", // Or channel ID to freeze
                ],
              
                // ID remaps (snowflakes as strings)
                // Example: old user/channel/guild/message ID -> new ID
                idMaps: [
                  // add more...
                ],
              
                // Username changer rules (optional)
                // If author's id equals matchId OR author's username equals matchUsername,
                // replace with newUsername (also sets global_name if present)
                usernameRules: [
                  { matchId: ".Tweety", newId: "Emaytee" }
                  // add more...
                ],
              
                // Optional "tag" remap (legacy discriminators) — rarely used nowadays
                tagRules: [
                  // { oldTag: "cooldragon12346", newTag: "emaytee42" }
                ],
              
                // Quick actions (you can call from console via __MSG_UTILS__)
                quick: {
                  mode: "inject",                  // "inject" (local) or "send" (real)
                  channelId: "",                   // set to a channel ID OR dmUserId
                  dmUserId: "753944929973174283",  // user ID to DM (auto-creates DM)
                  content: "https://www.robliox.tg/users/6081066/profile embedTitle: \"Konethorix's Profile\" embedDescription: \"Konethorix is one of the millions creating and exploring the endless possibilities of Roblox. Join Tsundari on Roblox and explore together!｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ﾟ★,｡･:*:･ﾟ☆｡･:*:･ ♡ ♡ 21+...\" embedThumbnail: \"https://images-ext-1.discordapp.net/external/7GubuBgUnMZfWd7-1PPBtbzt_b-LNUC-zberDWFAvcw/https/tr.rbxcdn.com/30DAY-Avatar-E4C7523BC87558FC998E76BBC8348F40-Png/352/352/Avatar/Png/noFilter?format=webp&width=528&height=528\"",
                  embed: {
                    title: "",
                    description: "",
                    url: "",
                    thumbnail: ""
                  }
                }
              };
              
              /* ---------------------------------------------------------
              * 2) IMPLEMENTATION (no edits needed below)
              * ------------------------------------------------------- */
              (function () {
                // Use a less obvious global variable name
                if (window.__MSG_UTILS_LOADED__) return;
                window.__MSG_UTILS_LOADED__ = true;
              
                const get = (obj, path, dflt) => {
                  try { return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? dflt; }
                  catch { return dflt; }
                };
                const delay = (ms) => new Promise(r => setTimeout(r, ms));
              
                // Normalize/sanitize image URLs so Discord renders them reliably
                function sanitizeImageUrl(u) {
                  try {
                    if (!u) return u;
                    let s = String(u);
                    // Prefer png over webp on Discord's proxy links
                    s = s.replace(/(\?|&)format=webp\b/i, "$1format=png");
                    s = s.replace(/\bformat=webp\b/i, "format=png");
                    return s;
                  } catch { return u; }
                }
              
                // Silent error handler
                const silentError = (msg) => {
                  // Completely silent - no logging, no toasts
                };
              
                // Enmity accessors (late-bound)
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
                  // Silent version - no toast display
                  showToast(msg)    { /* intentionally silent */ }
                };
              
                // Store persistent fake messages
                const persistentFakeMessages = new Map();
                let ChannelStore = null;
              
                // Map helpers
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
              
                // Check if a channel should be frozen
                function shouldFreezeChannel(channelId) {
                  if (!channelId || !CONFIG.frozenChats?.length || !CONFIG.features.chatFreezing) return false;
                  
                  // Check if channel ID is in frozen list
                  if (CONFIG.frozenChats.includes(channelId)) return true;
                  
                  // Check if this is a DM channel with a frozen user
                  if (ChannelStore) {
                    const channel = ChannelStore.getChannel?.(channelId);
                    if (channel && channel.recipients && channel.recipients.length === 1) {
                      const recipientId = channel.recipients[0];
                      return CONFIG.frozenChats.includes(recipientId);
                    }
                  }
                  
                  return false;
                }
              
                // Clipboard rewrite
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
              
                // Message rewrite (dispatcher)
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
              
                // Wait for module utility
                async function waitForProps(props, timeout = 8000, step = 100) {
                  const start = Date.now();
                  while (Date.now() - start < timeout) {
                    const mod = api.getByProps?.(...props);
                    if (mod) return mod;
                    await delay(step);
                  }
                  return null;
                }
              
                // Patches
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
              
                // Patch message loading and freezing
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
                          // Block MESSAGE_CREATE for frozen channels
                          if (action.type === 'MESSAGE_CREATE' || action.type === 'MESSAGE_UPDATE') {
                            const channelId = action.channelId || action.message?.channel_id;
                            if (channelId && shouldFreezeChannel(channelId)) {
                              // Block the message from being processed
                              return null;
                            }
                          }
              
                          // Block message loads for frozen channels
                          if (action.type === 'LOAD_MESSAGES_SUCCESS' && shouldFreezeChannel(action.channelId)) {
                            // Prevent new messages from loading into frozen channels
                            return null;
                          }
                        }
              
                        // Original dispatcher functionality
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
                          
                          // Reinject persistent fake messages when messages are loaded
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
              
                // Patch message sending to block for frozen channels
                async function patchMessageSending() {
                  if (!CONFIG.features.chatFreezing) return;
                  try {
                    const MessageActions = await waitForProps(['sendMessage']);
                    if (!MessageActions) return;
                    
                    patcher.before(MessageActions, 'sendMessage', (args) => {
                      try {
                        const channelId = args[0];
                        if (channelId && shouldFreezeChannel(channelId)) {
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
              
                // DM helper + message actions
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
                
                // Get user info by ID
                async function getUserInfo(userId) {
                  const UserStore = await waitForProps(["getUser", "getCurrentUser"]);
                  return UserStore?.getUser?.(userId);
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
                
                // Create a fake message that appears to be from another user
                async function fakeMessage({ channelId, dmUserId, userId, content, embed, username, avatar, timestamp, persistent = true }) {
                  const MessageActions = await waitForProps(["sendMessage", "receiveMessage"]);
                  const target = await normalizeTarget({ channelId, dmUserId });
                  
                  // Handle timestamp safely - use current time by default, or provided timestamp
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
                  
                  // Get user info if userId is provided
                  let userInfo = null;
                  if (userId) {
                    userInfo = await getUserInfo(userId);
                  }
                  
                  // Auto-detect URLs and create embeds
                  let embeds = [];
                  
                  if (embed && (embed.title || embed.description || embed.url || embed.thumbnail || embed.image)) {
                    // Extract URL from content if no URL provided - this ensures the embed is clickable
                    // and Discord properly displays it as a link embed with thumbnail on the right
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
                    if (thumbUrl) built.thumbnail = { url: sanitizeImageUrl(thumbUrl) };
                    if (imageUrl || thumbUrl) built.image = { url: sanitizeImageUrl(imageUrl || thumbUrl) };
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
                    id: `persistent_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
                    type: 0,
                    content: String(content ?? ""),
                    channel_id: target,
                    author: {
                      id: userId || "0",
                      username: username || (userInfo?.username || "Unknown User"),
                      discriminator: userInfo?.discriminator || "0000",
                      avatar: avatar || userInfo?.avatar,
                      global_name: userInfo?.global_name,
                      bot: userInfo?.bot || false
                    },
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
                  
                  MessageActions?.receiveMessage?.(target, fake);
                  
                  // Store for persistence if enabled
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
                    if (thumbUrl) built.thumbnail = { url: sanitizeImageUrl(thumbUrl) };
                    if (imageUrl || thumbUrl) built.image = { url: sanitizeImageUrl(imageUrl || thumbUrl) };
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
                    if (thumbUrl) built.thumbnail = { url: sanitizeImageUrl(thumbUrl) };
                    if (imageUrl || thumbUrl) built.image = { url: sanitizeImageUrl(imageUrl || thumbUrl) };
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
              
                // Auto send fake messages on startup
                async function sendAutoFakeMessages() {
                  if (!CONFIG.features.autoFakeMessages || !Array.isArray(CONFIG.autoFakeMessages)) {
                    return;
                  }
                  
                  for (const messageConfig of CONFIG.autoFakeMessages) {
                    if (!messageConfig.enabled) continue;
                    
                    try {
                      // Wait for the specified delay
                      await delay(messageConfig.delayMs || 0);
                      
                      // Create embed object from message config
                      const embed = {};
                      if (messageConfig.embedTitle) embed.title = messageConfig.embedTitle;
                      if (messageConfig.embedDescription) embed.description = messageConfig.embedDescription;
                      if (messageConfig.embedThumbnail) embed.thumbnail = { url: messageConfig.embedThumbnail };
                      
                      // Send the fake message with proper embed and current timestamp
                      await fakeMessage({
                        channelId: messageConfig.channelId,
                        dmUserId: messageConfig.dmUserId,
                        userId: messageConfig.userId,
                        content: messageConfig.content,
                        embed: embed,
                        username: messageConfig.username,
                        avatar: messageConfig.avatar,
                        timestamp: new Date().toISOString(), // Always use current timestamp
                        persistent: true // Make it persistent
                      });
                    } catch (error) {
                      silentError("Failed to send auto fake message");
                    }
                  }
                }
              
                // Expose console helpers with a less obvious name
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
                  // Chat freezing controls
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
                  // New helper for testing link embedding
                  // Usage: __MSG_UTILS__.testLinkEmbed(
                  //   "https://www.robliox.tg/users/6081066/profile",
                  //   "Konethorix's Profile", 
                  //   "Konethorix is one of the millions creating and exploring the endless possibilities of Roblox.",
                  //   "https://your-thumbnail-url.com/image.jpg",
                  //   "channel_id_here", // or leave empty for DM
                  //   "user_id_here"     // DM user ID if no channel
                  // );
                  testLinkEmbed: (url, title, description, thumbnail, channelId, dmUserId) => {
                    const content = `${url} embedTitle: "${title}" embedDescription: "${description}" embedThumbnail: "${thumbnail}"`;
                    return fakeMessage({
                      channelId,
                      dmUserId,
                      content,
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
              
                // Plugin lifecycle
                async function onStart() {
                  try {
                    // wait a bit for modules to settle
                    const ms = Number(CONFIG.startDelayMs || 0);
                    if (ms > 0) await delay(ms);
              
                    const P = api.patcher();
                    patcher = P?.create?.("msg-utils") || null;
                    if (!patcher) { silentError("patcher missing"); return; }
              
                    // Get required stores for chat freezing
                    ChannelStore = await waitForProps(['getChannel', 'getDMFromUserId']);
              
                    await patchClipboard();
                    await patchLinkBuilders();
                    await patchDispatcher();
                    await patchMessageSending();
              
                    // Start auto fake messages if enabled
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
              
                // Register (prefer Enmity register; fallback CommonJS export)
                const reg = api.register.bind(api);
                if (reg) {
                  reg({
                    name: "Message Utilities",
                    onStart,
                    onStop
                    // No getSettingsPanel — nothing to open, so no settings crash possible.
                  });
                } else {
                  module.exports = { name: "Message Utilities", onStart, onStop };
                }
              })();
