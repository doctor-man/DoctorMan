require('dotenv').config()
const { decryptMedia } = require('@open-wa/wa-automate')

const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')
const axios = require('axios')
const fetch = require('node-fetch')

const {
    removeBackgroundFromImageBase64
} = require('remove.bg')

const {
    exec
} = require('child_process')

const {
    menuId,
    cekResi,
    urlShortener,
    meme,
    translate,
    getLocationData,
    images,
    resep,
    rugapoi,
    rugaapi
} = require('./lib')

const {
    msgFilter,
    color,
    processTime,
    isUrl
} = require('./utils')

const { uploadImages } = require('./utils/fetcher')

const fs = require('fs-extra')
const banned = JSON.parse(fs.readFileSync('./settings/banned.json'))
const {
    ownerNumber,
    groupLimit,
    memberLimit,
    prefix
} = JSON.parse(fs.readFileSync('./settings/setting.json'))
const {
    apiNoBg
} = JSON.parse(fs.readFileSync('./settings/api.json'))

module.exports = HandleMsg = async(aruga, message) => {
        try {
            const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, quotedMsgObj, mentionedJidList } = message
            let { body } = message
            var { name, formattedTitle } = chat
            let { pushname, verifiedName, formattedName } = sender
            pushname = pushname || verifiedName || formattedName // verifiedName is the name of someone who uses a business account
            const botNumber = await aruga.getHostNumber() + '@c.us'
            const groupId = isGroupMsg ? chat.groupMetadata.id : ''
            const groupAdmins = isGroupMsg ? await aruga.getGroupAdmins(groupId) : ''
            const isGroupAdmins = groupAdmins.includes(sender.id) || false
            const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
            const isOwnerBot = ownerNumber == sender.id

            const isBanned = banned.includes(sender.id)

            // Bot Prefix
            body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(prefix)) ? caption : ''
            const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
            const arg = body.trim().substring(body.indexOf(' ') + 1)
            const args = body.trim().split(/ +/).slice(1)
            const isCmd = body.startsWith(prefix)
            const uaOverride = process.env.UserAgent
            const url = args.length !== 0 ? args[0] : ''
            const isQuotedImage = quotedMsg && quotedMsg.type === 'image'
            const isQuotedVideo = quotedMsg && quotedMsg.type === 'video'

            // [BETA] Avoid Spam Message
            if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
            if (isCmd && msgFilter.isFiltered(from) && isGroupMsg) { return console.log(color('[SPAM]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }
            //
            if (!isCmd) { return }
            if (isCmd && !isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname)) }
            if (isCmd && isGroupMsg) { console.log(color('[EXEC]'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name || formattedTitle)) }

            // [BETA] Avoid Spam Message
            msgFilter.addFilter(from)

            if (isBanned) {
                return console.log(color('[BAN]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
            }
            switch (command) {
                // Menu and TnC
                case 'speed':
                case 'ping':
                    await aruga.sendText(from, `Pong!!!!\nSpeed: ${processTime(t, moment())} _Second_`)
                    break
                case 'tnc':
                    await aruga.sendText(from, menuId.textTnC())
                    break
                case 'menu':
                case 'help':
                case 'مساعدة':
                case 'مساعده':
                case 'bot':
                case 'Bot':
                    await aruga.sendText(from, menuId.textMenu(pushname))
                        .then(() => ((isGroupMsg) && (isGroupAdmins)) ? aruga.sendText(from, `Menu Admin Grup: *${prefix}menuadmin*`) : null)
                    break
                case 'menuadmin':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    await aruga.sendText(from, menuId.textAdmin())
                    break
                case 'donate':
                case 'donasi':
                case 'دعم':
                    await aruga.sendText(from, menuId.textDonasi())
                    break
                case 'ownerbot':
                    await aruga.sendContact(from, ownerNumber)
                        .then(() => aruga.sedText(from, 'If you want to request a feature, please chat with the owner number!'))
                    break
                case 'join':
                case 'انظمام':
                    if (args.length == 0) return aruga.reply(from, `If you want to invite bots to the group please invite or by\ntype ${prefix}join [link group]`, id)
                    let linkgrup = body.slice(6)
                    let islink = linkgrup.match(/(https:\/\/chat.whatsapp.com)/gi)
                    let chekgrup = await aruga.inviteInfo(linkgrup)
                    if (!islink) return aruga.reply(from, 'Sorry the group link is wrong! please send us the correct link', id)
                    if (isOwnerBot) {
                        await aruga.joinGroupViaLink(linkgrup)
                            .then(async() => {
                                await aruga.sendText(from, 'Successfully joined the group via link!')
                                await aruga.sendText(chekgrup.id, `Hello Everyone~, Im Aruga BOT. To find out the commands on this bot type ${prefix}menu`)
                            })
                    } else {
                        let cgrup = await aruga.getAllGroups()
                        if (cgrup.length > groupLimit) return aruga.reply(from, `Sorry, the group on this bot is full\nMax Group is: ${groupLimit}`, id)
                        if (cgrup.size < memberLimit) return aruga.reply(from, `Sorry, BOT wil not join if the group members do not exceed ${memberLimit} people`, id)
                        await aruga.joinGroupViaLink(linkgrup)
                            .then(async() => {
                                await aruga.reply(from, 'Successfully joined the group via link!', id)
                            })
                            .catch(() => {
                                aruga.reply(from, 'Failed!', id)
                            })
                    }
                    break

                    // Sticker Creator
                case 'sticker':
                case 'stiker':
                case 'stiaker':
                case 'steker':
                case 'ستكر':
                    if ((isMedia || isQuotedImage) && args.length === 0) {
                        const encryptMedia = isQuotedImage ? quotedMsg : message
                        const _mimetype = isQuotedImage ? quotedMsg.mimetype : mimetype
                        const mediaData = await decryptMedia(encryptMedia, uaOverride)
                        const imageBase64 = `data:${_mimetype};base64,${mediaData.toString('base64')}`
                        aruga.sendImageAsSticker(from, imageBase64)
                            .then(() => {
                                aruga.reply(from, 'Here\'s your sticker')
                                console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                            })
                    } else if (args[0] === 'nobg') {
                        if (isMedia || isQuotedImage) {
                            try {
                                var mediaData = await decryptMedia(message, uaOverride)
                                var imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                                var base64img = imageBase64
                                var outFile = './media/noBg.png'
                                    // kamu dapat mengambil api key dari website remove.bg dan ubahnya difolder settings/api.json
                                var result = await removeBackgroundFromImageBase64({ base64img, apiKey: apiNoBg, size: 'auto', type: 'auto', outFile })
                                await fs.writeFile(outFile, result.base64img)
                                await aruga.sendImageAsSticker(from, `data:${mimetype};base64,${result.base64img}`)
                            } catch (err) {
                                console.log(err)
                                await aruga.reply(from, "Sorry, today's usage limit has reached the maximum", id)
                            }
                        }
                    } else if (args.length === 1) {
                        if (!isUrl(url)) { await aruga.reply(from, 'Sorry, the link you submitted is invalid.', id) }
                        aruga.sendStickerfromUrl(from, url).then((r) => (!r && r !== undefined) ?
                            aruga.sendText(from, 'Sorry, the link you sent does not contain an image.') :
                            aruga.reply(from, 'Here\'s your sticker')).then(() => console.log(`Sticker Processed for ${processTime(t, moment())} Second`))
                    } else {
                        await aruga.reply(from, `No picture! To use ${prefix}sticker\n\n\nSend pictures with captions\n${prefix}sticker <usual>\n${prefix}sticker nobg <no background>\n\nor Send message with\n${prefix}sticker <link_gambar>`, id)
                    }
                    break
                case 'stickergif':
                case 'stikergif':
                case 'gifsticker':
                case 'gifstiker':
                case 'قيف-ستكر':
                case 'قيف':
                    if (isMedia || isQuotedVideo) {
                        if (mimetype === 'video/mp4' && message.duration < 10 || mimetype === 'image/gif' && message.duration < 10) {
                            var mediaData = await decryptMedia(message, uaOverride)
                            aruga.reply(from, '[WAIT] Being processed⏳ Please wait ± 1 min!', id)
                            var filename = `./media/stickergif.${mimetype.split('/')[1]}`
                            await fs.writeFileSync(filename, mediaData)
                            await exec(`gify ${filename} ./media/stickergf.gif --fps=30 --scale=240:240`, async function(error, stdout, stderr) {
                                var gif = await fs.readFileSync('./media/stickergf.gif', { encoding: "base64" })
                                await aruga.sendImageAsSticker(from, `data:image/gif;base64,${gif.toString('base64')}`)
                                    .catch(() => {
                                        aruga.reply(from, 'Sorry the file is too big!', id)
                                    })
                            })
                        } else {
                            aruga.reply(from, `[❗] Send a gif with a caption *${prefix}stickergif* max 10 sec!`, id)
                        }
                    } else {
                        aruga.reply(from, `[❗] Send a gif with a caption *${prefix}stickergif*`, id)
                    }
                    break
                case 'stikergiphy':
                case 'stickergiphy':
                case 'giphysticker':
                case 'giphystiker':
                case 'قيفي-ستكر':
                case 'قيفي':
                    if (args.length !== 1) return aruga.reply(from, `Sorry, the message format is wrong.\ntype order with ${prefix}stickergiphy <link_giphy>`, id)
                    const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))
                    const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
                    if (isGiphy) {
                        const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                        if (!getGiphyCode) { return aruga.reply(from, 'Failed to retrieve the giphy code', id) }
                        const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                        const smallGifUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                        aruga.sendGiphyAsSticker(from, smallGifUrl).then(() => {
                            aruga.reply(from, 'Here\'s your sticker')
                            console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                        }).catch((err) => console.log(err))
                    } else if (isMediaGiphy) {
                        const gifUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                        if (!gifUrl) { return aruga.reply(from, 'Failed to retrieve the giphy code', id) }
                        const smallGifUrl = url.replace(gifUrl[0], 'giphy-downsized.gif')
                        aruga.sendGiphyAsSticker(from, smallGifUrl)
                            .then(() => {
                                aruga.reply(from, 'Here\'s your sticker')
                                console.log(`Sticker Processed for ${processTime(t, moment())} Second`)
                            })
                            .catch(() => {
                                aruga.reply(from, `Something went wrong!`, id)
                            })
                    } else {
                        await aruga.reply(from, 'Sorry, the giphy command sticker can only use the link from giphy.  [Giphy Only]', id)
                    }
                    break
                case 'meme':
                    if ((isMedia || isQuotedImage) && args.length >= 2) {
                        const top = arg.split('|')[0]
                        const bottom = arg.split('|')[1]
                        const encryptMedia = isQuotedImage ? quotedMsg : message
                        const mediaData = await decryptMedia(encryptMedia, uaOverride)
                        const getUrl = await uploadImages(mediaData, false)
                        const ImageBase64 = await meme.custom(getUrl, top, bottom)
                        aruga.sendFile(from, ImageBase64, 'image.png', '', null, true)
                            .then(() => {
                                aruga.reply(from, 'Thank you!', id)
                            })
                            .catch(() => {
                                aruga.reply(from, 'Something went wrong!')
                            })
                    } else {
                        await aruga.reply(from, `Process No image! Please send an image with a like caption ${prefix}meme <text_up> | <text_down>\nexample: ${prefix}meme top text | bottom text`, id)
                    }
                    break
                case 'quotemaker':
                    const qmaker = body.trim().split('|')
                    if (qmaker.length >= 3) {
                        const quotes = qmaker[1]
                        const author = qmaker[2]
                        const theme = qmaker[3]
                        aruga.reply(from, 'Proses like..', id)
                        try {
                            const hasilqmaker = await images.quote(quotes, author, theme)
                            aruga.sendFileFromUrl(from, `${hasilqmaker}`, '', 'This is brother..', id)
                        } catch {
                            aruga.reply('Well the process failed, brother, is it correct yet?..', id)
                        }
                    } else {
                        aruga.reply(from, `Usage ${prefix}quotemaker |isi quote|author|theme\n\nexample: ${prefix}quotemaker |I love you | -aruga|random\n\nfor the theme use random yes brother..`)
                    }
                    break
                    //case 'nulis':
                    //  if (args.length == 0) return aruga.reply(from, `Make the bot write the text that is sent as an image\nUsage: ${prefix}write [text]\n\nexample: ${prefix}write i love you 3000`, id)
                    //const nulisq = body.slice(7)
                    //const nulisp = await rugaapi.tulis(nulisq)
                    //await aruga.sendImage(from, `${nulisp}`, '', 'Nih...', id)
                    //  .catch(() => {
                    //    aruga.reply(from, 'Something went wrong!', id)
                    //})
                    //break

                    //Islam Command
                    //case 'listsurah':
                    //  try {
                    //    axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                    //      .then((response) => {
                    //        let hehex = '╔══✪〘 List Surah 〙✪══\n'
                    //      for (let i = 0; i < response.data.data.length; i++) {
                    //        hehex += '╠➥ '
                    //      hehex += response.data.data[i].name.transliteration.id.toLowerCase() + '\n'
                    //}
                    // hehex += '╚═〘 *A R U G A  B O T* 〙'
                    //aruga.reply(from, hehex, id)
                    //})
                    //} catch (err) {
                    //  aruga.reply(from, err, id)
                    //}
                    //break
                    //case 'infosurah':
                    /// if (args.length == 0) return aruga.reply(from, `*_${prefix}infosurah <nama surah>_*\nDisplays complete information about a certain surah. example usage: ${prefix}infosurah al-baqarah`, message.id)
                    //var responseh = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                    //var { data } = responseh.data
                    //var idx = data.findIndex(function(post, index) {
                    //  if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    //    return true;
                    //});
                    //var pesan = ""
                    //pesan = pesan + "Name : " + data[idx].name.transliteration.id + "\n" + "Asma : " + data[idx].name.short + "\n" + "Arti : " + data[idx].name.translation.id + "\n" + "Jumlah ayat : " + data[idx].numberOfVerses + "\n" + "Number surah : " + data[idx].number + "\n" + "Type : " + data[idx].revelation.id + "\n" + "Information : " + data[idx].tafsir.id
                    //aruga.reply(from, pesan, message.id)
                    //break
                    //case 'surah':
                    //  if (args.length == 0) return aruga.reply(from, `*_${prefix}surah <nama surah> <ayat>_*\nDisplays specific Quranic verses and their translation in English. usage example : ${prefix}surah al-baqarah 1\n\n*_${prefix}surah <nama surah> <ayat> en/id_*\nDisplays certain Al-Quran verses and their translations in English / Indonesian. example usage : ${prefix}surah al-baqarah 1 id`, message.id)
                    // var responseh = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                    //var { data } = responseh.data
                    //var idx = data.findIndex(function(post, index) {
                    //   if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    //     return true;
                    // });
                    //nmr = data[idx].number
                    //if (!isNaN(nmr)) {
                    // var responseh2 = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + args[1])
                    //var { data } = responseh2.data
                    //var last = function last(array, n) {
                    //  if (array == null) return void 0;
                    // if (n == null) return array[array.length - 1];
                    //return array.slice(Math.max(array.length - n, 0));
                    //};
                    //bhs = last(args)
                    //pesan = ""
                    //pesan = pesan + data.text.arab + "\n\n"
                    //if (bhs == "en") {
                    //  pesan = pesan + data.translation.en
                    //} else {
                    //  pesan = pesan + data.translation.id
                    // }
                    //pesan = pesan + "\n\n(Q.S. " + data.surah.name.transliteration.id + ":" + args[1] + ")"
                    //aruga.reply(from, pesan, message.id)
                    // }
                    //break
                    //case 'tafsir':
                    //if (args.length == 0) return aruga.reply(from, `*_${prefix}tafsir <nama surah> <ayat>_*\nDisplays specific Quranic verses along with their translation and interpretation in English. usage example : ${prefix}tafsir al-baqarah 1`, message.id)
                    //var responsh = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                    //var { data } = responsh.data
                    //var idx = data.findIndex(function(post, index) {
                    //if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    //return true;
                    //});
                    //nmr = data[idx].number
                    //if (!isNaN(nmr)) {
                    //var responsih = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + args[1])
                    //var { data } = responsih.data
                    //pesan = ""
                    //pesan = pesan + "Tafsir Q.S. " + data.surah.name.transliteration.id + ":" + args[1] + "\n\n"
                    //pesan = pesan + data.text.arab + "\n\n"
                    //pesan = pesan + "_" + data.translation.id + "_" + "\n\n" + data.tafsir.id.long
                    //aruga.reply(from, pesan, message.id)
                    //}
                    //break
                    //case 'alaudio':
                    //if (args.length == 0) return aruga.reply(from, `*_${prefix}ALaudio <nama surah>_*\nDisplays a link from a specific audio surah. example usage : ${prefix}ALaudio al-fatihah\n\n*_${prefix}ALaudio <nama surah> <ayat>_*\nSend audio surah and certain verses along with their translation in Arabic. example usage : ${prefix}ALaudio al-fatihah 1\n\n*_${prefix}ALaudio <nama surah> <ayat> en_*\nSend audio surahs and certain verses along with their translations in English. example usage : ${prefix}ALaudio al-fatihah 1 en`, message.id)
                    //ayat = "ayat"
                    //bhs = ""
                    //var responseh = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah.json')
                    //var surah = responseh.data
                    //var idx = surah.data.findIndex(function(post, index) {
                    //if ((post.name.transliteration.id.toLowerCase() == args[0].toLowerCase()) || (post.name.transliteration.en.toLowerCase() == args[0].toLowerCase()))
                    //return true;
                    //});
                    //nmr = surah.data[idx].number
                    //if (!isNaN(nmr)) {
                    //if (args.length > 2) {
                    //ayat = args[1]
                    //}
                    //if (args.length == 2) {
                    //var last = function last(array, n) {
                    //if (array == null) return void 0;
                    //if (n == null) return array[array.length - 1];
                    //return array.slice(Math.max(array.length - n, 0));
                    //};
                    //ayat = last(args)
                    //}
                    //  pesan = ""
                    //if (isNaN(ayat)) {
                    //var responsih2 = await axios.get('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/islam/surah/' + nmr + '.json')
                    //var { name, name_translations, number_of_ayah, number_of_surah, recitations } = responsih2.data
                    //pesan = pesan + "Audio Quran Surah ke-" + number_of_surah + " " + name + " (" + name_translations.ar + ") " + "with the number " + number_of_ayah + " ayat\n"
                    //pesan = pesan + "Dilantunkan oleh " + recitations[0].name + " : " + recitations[0].audio_url + "\n"
                    //pesan = pesan + "Dilantunkan oleh " + recitations[1].name + " : " + recitations[1].audio_url + "\n"
                    //pesan = pesan + "Dilantunkan oleh " + recitations[2].name + " : " + recitations[2].audio_url + "\n"
                    //aruga.reply(from, pesan, message.id)
                    //} else {
                    //var responsih2 = await axios.get('https://api.quran.sutanlab.id/surah/' + nmr + "/" + ayat)
                    //var { data } = responsih2.data
                    //var last = function last(array, n) {
                    //if (array == null) return void 0;
                    //if (n == null) return array[array.length - 1];
                    //return array.slice(Math.max(array.length - n, 0));
                    //};
                    //bhs = last(args)
                    //pesan = ""
                    //pesan = pesan + data.text.arab + "\n\n"
                    //if (bhs == "en") {
                    //pesan = pesan + data.translation.en
                    //} else {
                    //pesan = pesan + data.translation.id
                    //}
                    //pesan = pesan + "\n\n(Q.S. " + data.surah.name.transliteration.id + ":" + args[1] + ")"
                    //await aruga.sendFileFromUrl(from, data.audio.secondary[0])
                    //await aruga.reply(from, pesan, message.id)
                    //}
                    //}
                    break
                    //case 'jsolat':
                    //if (args.length == 0) return aruga.reply(from, `To see the prayer schedule for each area\ntype: ${prefix}jsolat [area]\n\nfor a list of existing areas\ntype: ${prefix}area`, id)
                    //const solatx = body.slice(8)
                    //const solatj = await rugaapi.jadwalarea(solatx)
                    //await aruga.reply(from, solatj, id)
                    //.catch(() => {
                    //aruga.reply(from, 'Already input the existing area listed?', id)
                    //})
                    break
                case 'area':
                    const areaq = await rugaapi.area()
                    await aruga.reply(from, areaq, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                    //Media
                case 'instagram':
                case 'ig':
                case 'انستا':
                    if (args.length == 0) return aruga.reply(from, `To download images or videos from Instagram\ntype: ${prefix}instagram [link_ig]`, id)
                    const instag = await rugaapi.insta(args[0])
                    await aruga.sendFileFromUrl(from, instag, '', '', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'ytmp3':
                    if (args.length == 0) return aruga.reply(from, `To download songs from youtube\ntype: ${prefix}ytmp3 [link_yt]`, id)
                    rugaapi.ytmp3(args[0])
                        .then(async(res) => {
                            if (res.status == 'error') return aruga.sendFileFromUrl(from, `${res.link}`, '', `${res.judul}`, id)
                            if (res.status == 'filesize') return aruga.sendFileFromUrl(from, `${res.link}`, '', `${res.judul}`, id)
                            await aruga.sendFileFromUrl(from, `${res.thumb}`, '', `Youtube found\n\nTitle: ${res.judul}\n\nSize: ${res.size}\n\nAudio is being sent`, id)
                            await aruga.sendFileFromUrl(from, `${res.link}`, '', '', id)
                        })
                    break
                case 'ytmp4':
                    if (args.length == 0) return aruga.reply(from, `To download videos from youtube\ntype: ${prefix}ytmp4 [link_yt]`)
                    rugaapi.ytmp4(args[0])
                        .then(async(res) => {
                            if (res.status == 'error') return aruga.sendFileFromUrl(from, `${res.link}`, '', `${res.judul}`, id)
                            if (res.status == 'filesize') return aruga.sendFileFromUrl(from, `${res.link}`, '', `${res.judul}`, id)
                            await aruga.sendFileFromUrl(from, `${res.thumb}`, '', `Youtube found\n\nTitle: ${res.judul}\n\nSize: ${res.size}\n\nVideo is being sent`, id)
                            await aruga.sendFileFromUrl(from, `${res.link}`, '', '', id)
                        })
                    break

                    // Random the word
                case 'fact':
                    fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/faktaunix.txt')
                        .then(res => res.text())
                        .then(body => {
                            let splitnix = body.split('\n')
                            let randomnix = splitnix[Math.floor(Math.random() * splitnix.length)]
                            aruga.reply(from, randomnix, id)
                        })
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'the wordbijak':
                    fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/the wordbijax.txt')
                        .then(res => res.text())
                        .then(body => {
                            let splitbijak = body.split('\n')
                            let randombijak = splitbijak[Math.floor(Math.random() * splitbijak.length)]
                            aruga.reply(from, randombijak, id)
                        })
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'pantun':
                    fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/pantun.txt')
                        .then(res => res.text())
                        .then(body => {
                            let splitpantun = body.split('\n')
                            let randompantun = splitpantun[Math.floor(Math.random() * splitpantun.length)]
                            aruga.reply(from, randompantun.replace(/aruga-line/g, "\n"), id)
                        })
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'quote':
                    const quotex = await rugaapi.quote()
                    await aruga.reply(from, quotex, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break

                    //Random Images
                case 'anime':
                    if (args.length == 0) return aruga.reply(from, `To use ${prefix}anime\nPlease type: ${prefix}anime [query]\nexample: ${prefix}anime random\n\nthe available query:\nrandom, waifu, husbu, neko`, id)
                    if (args[0] == 'random' || args[0] == 'waifu' || args[0] == 'husbu' || args[0] == 'neko') {
                        fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/anime/' + args[0] + '.txt')
                            .then(res => res.text())
                            .then(body => {
                                let randomnime = body.split('\n')
                                let randomnimex = randomnime[Math.floor(Math.random() * randomnime.length)]
                                aruga.sendFileFromUrl(from, randomnimex, '', 'Nee..', id)
                            })
                            .catch(() => {
                                aruga.reply(from, 'Something went wrong!', id)
                            })
                    } else {
                        aruga.reply(from, `Sorry the query is not available. Please type ${prefix}anime to view the query list`)
                    }
                    break
                case 'kpop':
                    if (args.length == 0) return aruga.reply(from, `To use ${prefix}kpop\nPlease type: ${prefix}kpop [query]\nexample: ${prefix}kpop bts\n\nthe available query:\nblackpink, exo, bts`, id)
                    if (args[0] == 'blackpink' || args[0] == 'exo' || args[0] == 'bts') {
                        fetch('https://raw.githubusercontent.com/ArugaZ/grabbed-results/main/random/kpop/' + args[0] + '.txt')
                            .then(res => res.text())
                            .then(body => {
                                let randomkpop = body.split('\n')
                                let randomkpopx = randomkpop[Math.floor(Math.random() * randomkpop.length)]
                                aruga.sendFileFromUrl(from, randomkpopx, '', 'Nee..', id)
                            })
                            .catch(() => {
                                aruga.reply(from, 'Something went wrong!', id)
                            })
                    } else {
                        aruga.reply(from, `Sorry the query is not available. Please type ${prefix}kpop to see the query list`)
                    }
                    break
                case 'memes':
                    const randmeme = await meme.random()
                    aruga.sendFileFromUrl(from, randmeme, '', '', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break

                    // Search Any
                case 'images':
                    if (args.length == 0) return aruga.reply(from, `To search for images on pinterest\ntype: ${prefix}images [search]\nexample: ${prefix}images naruto`, id)
                    const cariwall = body.slice(8)
                    const hasilwall = await images.fdci(cariwall)
                    aruga.sendFileFromUrl(from, hasilwall, '', '', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'reddit':
                    if (args.length == 0) return aruga.reply(from, `To search for images on sub reddit\ntype: ${prefix}reddit [search]\nexample: ${prefix}reddit naruto`, id)
                    const carireddit = body.slice(9)
                    const hasilreddit = await images.sreddit(carireddit)
                    aruga.sendFileFromUrl(from, hasilreddit, '', '', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                case 'resep':
                    if (args.length == 0) return aruga.reply(from, `To find food recipes\nThe way type: ${prefix}recipe [search]\n\nexample: ${prefix}recipe tofu`, id)
                    const cariresep = body.slice(7)
                    const hasilresep = await resep.resep(cariresep)
                    aruga.reply(from, hasilresep + '\n\nThis is the recipe for the food..', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'nekopoi':
                    aruga.sendText(from, `sorry this function isn't working anymore!`)
                    rugapoi.getLatest()
                        .then((result) => {
                            rugapoi.getVideo(result.link)
                                .then((res) => {
                                    let heheq = '\n'
                                    for (let i = 0; i < res.links.length; i++) {
                                        heheq += `${res.links[i]}\n`
                                    }
                                    aruga.reply(from, `Title: ${res.title}\n\nLink:\n${heheq}\nstill a bntr tester :v`)
                                })
                        })
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'stalkig':
                    if (args.length == 0) return aruga.reply(from, `To stalk someone's Instagram account\ntype ${prefix}stalkig [username]\nexample: ${prefix}stalkig this person`, id)
                    const igstalk = await rugaapi.stalkig(args[0])
                    const igstalkpict = await rugaapi.stalkigpict(args[0])
                    await aruga.sendFileFromUrl(from, igstalkpict, '', igstalk, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'wiki':
                    if (args.length == 0) return aruga.reply(from, `To find a word from wikipedia\ntype: ${prefix}wiki [the word]`, id)
                    const wikip = body.slice(6)
                    const wikis = await rugaapi.wiki(wikip)
                    await aruga.reply(from, wikis, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'weather':
                    if (args.length == 0) return aruga.reply(from, `To see the weather in an area\ntype: ${prefix}weather [area]`, id)
                    const cuacaq = body.slice(7)
                    const cuacap = await rugaapi.cuaca(cuacaq)
                    await aruga.reply(from, cuacap, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'chord':
                    if (args.length == 0) return aruga.reply(from, `To search for the lyrics and chords of a song\btype: ${prefix}chord [song title]`, id)
                    const chordq = body.slice(7)
                    const chordp = await rugaapi.chord(chordq)
                    await aruga.reply(from, chordp, id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'ss': //if an error, please open the file in the settings / api.json folder and change the apiSS 'API-KEY' which you got from the website https://apiflash.com/
                    if (args.length == 0) return aruga.reply(from, `Make bots screenshot a web\n\nUsage: ${prefix}ss [url]\n\nexample: ${prefix}ss http://google.com`, id)
                    const scrinshit = await meme.ss(args[0])
                    await aruga.sendFile(from, scrinshit, 'ss.jpg', 'cekrek', id)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'play': //please do your own custom if there is something you want to change
                    if (args.length == 0) return aruga.reply(from, `To search for songs from youtube\n\nUse: ${prefix}play the song title`, id)
                    axios.get(`https://arugaytdl.herokuapp.com/search?q=${body.slice(6)}`)
                        .then(async(res) => {
                            await aruga.sendFileFromUrl(from, `${res.data[0].thumbnail}`, ``, `Song found\n\nTitle: ${res.data[0].title}\nDuration: ${res.data[0].duration}second\nUploaded: ${res.data[0].uploadDate}\nView: ${res.data[0].viewCount}\n\nis being sent`, id)
                            axios.get(`https://arugaz.herokuapp.com/api/yta?url=https://youtu.be/${res.data[0].id}`)
                                .then(async(rest) => {
                                    if (Number(rest.data.filesize.split(' MB')[0]) >= 10.00) return aruga.reply(from, 'Sorry the file size is too large!')
                                    await aruga.sendPtt(from, `${rest.data.result}`, id)
                                })
                                .catch(() => {
                                    aruga.reply(from, 'Something went wrong!', id)
                                })
                        })
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break
                case 'whatanime':
                    if (isMedia && type === 'image' || quotedMsg && quotedMsg.type === 'image') {
                        if (isMedia) {
                            var mediaData = await decryptMedia(message, uaOverride)
                        } else {
                            var mediaData = await decryptMedia(quotedMsg, uaOverride)
                        }
                        const fetch = require('node-fetch')
                        const imgBS4 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                        aruga.reply(from, 'Searching....', id)
                        fetch('https://trace.moe/api/search', {
                                method: 'POST',
                                body: JSON.stringify({ image: imgBS4 }),
                                headers: { "Content-Type": "application/json" }
                            })
                            .then(respon => respon.json())
                            .then(resolt => {
                                if (resolt.docs && resolt.docs.length <= 0) {
                                    aruga.reply(from, "Sorry, I don't know what anime this is, make sure the image to be searched is not blurry / cut", id)
                                }
                                const { is_adult, title, title_chinese, title_romaji, title_english, episode, similarity, filename, at, tokenthumb, anilist_id } = resolt.docs[0]
                                teks = ''
                                if (similarity < 0.92) {
                                    teks = '*I have low faith in this* :\n\n'
                                }
                                teks += `➸ *Title Japanese* : ${title}\n➸ *Title chinese* : ${title_chinese}\n➸ *Title Romaji* : ${title_romaji}\n➸ *Title English* : ${title_english}\n`
                                teks += `➸ *R-18?* : ${is_adult}\n`
                                teks += `➸ *Eps* : ${episode.toString()}\n`
                                teks += `➸ *Similarity* : ${(similarity * 100).toFixed(1)}%\n`
                                var video = `https://media.trace.moe/video/${anilist_id}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`;
                                aruga.sendFileFromUrl(from, video, 'anime.mp4', teks, id).catch(() => {
                                    aruga.reply(from, teks, id)
                                })
                            })
                            .catch(() => {
                                aruga.reply(from, 'Something went wrong!', id)
                            })
                    } else {
                        aruga.reply(from, `Sorry the format is wrong\n\nPlease send a photo with a caption ${prefix}whatanime\n\nOr reply to photos with captions ${prefix}whatanime`, id)
                    }
                    break

                    // Other Command
                    //case 'resi':
                    //if (args.length !== 2) return aruga.reply(from, `Sorry, the message format is wrong.\nPlease type a message with ${prefix}solve <courier> <no_resolve>\n\nCourier available:\njne, pos, tiki, wahana, jnt, rpx, sap, sicepat, pcp, jet, dse, first, ninja, lion, idl, rex`, id)
                    //const kurirs = ['jne', 'pos', 'tiki', 'wahana', 'jnt', 'rpx', 'sap', 'sicepat', 'pcp', 'jet', 'dse', 'first', 'ninja', 'lion', 'idl', 'rex']
                    //if (!kurirs.includes(args[0])) return aruga.sendText(from, `Sorry, the shipping expedition type is not supported. This service only supports shipping expedition ${kurirs.join(', ')} Please check again.`)
                    //console.log('Check Receipt No.', args[1], 'by expedition', args[0])
                    //cekResi(args[0], args[1]).then((result) => aruga.sendText(from, result))
                    //break
                case 'tts':
                    if (args.length == 0) return aruga.reply(from, `Converts text to sound (google voice)\ntype: ${prefix}tts <language_code> <text>\nexample : ${prefix}tts id halo\nfor language code check here : https://anotepad.com/note/read/5xqahdy8`)
                    const ttsGB = require('node-gtts')(args[0])
                    const dataText = body.slice(8)
                    if (dataText === '') return aruga.reply(from, 'what is the text?..', id)
                    try {
                        ttsGB.save('./media/tts.mp3', dataText, function() {
                            aruga.sendPtt(from, './media/tts.mp3', id)
                        })
                    } catch (err) {
                        aruga.reply(from, err, id)
                    }
                    break
                case 'translate':
                    if (args.length != 1) return aruga.reply(from, `Sorry, the message format is wrong.\nPlease reply to a message with a caption ${prefix}translate <language_code>\nexample ${prefix}translate id`, id)
                    if (!quotedMsg) return aruga.reply(from, `Sorry, the message format is wrong.\nPlease reply to a message with a caption ${prefix}translate <language_code>\nexample ${prefix}translate id`, id)
                    const quoteText = quotedMsg.type == 'chat' ? quotedMsg.body : quotedMsg.type == 'image' ? quotedMsg.caption : ''
                    translate(quoteText, args[0])
                        .then((result) => aruga.sendText(from, result))
                        .catch(() => aruga.sendText(from, 'Error, wrong language code.'))
                    break
                case 'checklocation':
                case 'chlocation':
                    if (quotedMsg.type !== 'location') return aruga.reply(from, `Sorry, the message format is wrong.\nSend the location and reply with a caption ${prefix}check location`, id)
                    console.log(`Request for Covid-19 Spread Zone Status (${quotedMsg.lat}, ${quotedMsg.lng}).`)
                    const zoneStatus = await getLocationData(quotedMsg.lat, quotedMsg.lng)
                    if (zoneStatus.kode !== 200) aruga.sendText(from, 'Sorry, there was an error checking the location you submitted.')
                    let datax = ''
                    for (let i = 0; i < zoneStatus.data.length; i++) {
                        const { zone, region } = zoneStatus.data[i]
                        const _zone = zone == 'green' ? 'Hijau* (Aman) \n' : zone == 'yellow' ? 'Kuning* (Waspada) \n' : 'Merah* (Bahaya) \n'
                        datax += `${i + 1}. Kel. *${region}* Status *Zona ${_zone}`
                    }
                    const text = `*CHECK THE LOCATION OF THE SPREAD OF COVID-19*\nThe results of the inspection from the location you sent are *${zoneStatus.status}* ${zoneStatus.optional}\n\nAffected location information near you:\n${datax}`
                    aruga.sendText(from, text)
                    break
                case 'shortlink':
                    if (args.length == 0) return aruga.reply(from, `type ${prefix}shortlink <url>`, id)
                    if (!isUrl(args[0])) return aruga.reply(from, 'Sorry, the url you submitted is invalid.', id)
                    const shortlink = await urlShortener(args[0])
                    await aruga.sendText(from, shortlink)
                        .catch(() => {
                            aruga.reply(from, 'Something went wrong!', id)
                        })
                    break

                    // Group Commands (group admin only)
                case 'add':
                case 'اضافة':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
                    if (args.length !== 1) return aruga.reply(from, `To use ${prefix}add\nUse: ${prefix}add <nomor>\nexample: ${prefix}add 628xxx`, id)
                    try {
                        await aruga.addParticipant(from, `${args[0]}@c.us`)
                            .then(() => aruga.reply(from, 'Hi, welcome', id))
                    } catch {
                        aruga.reply(from, 'Unable to add target', id)
                    }
                    break
                case 'kick':
                case 'ازالة':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
                    if (mentionedJidList.length === 0) return aruga.reply(from, 'Sorry, the message format is wrong.\nPlease tag one or more people to be excluded', id)
                    if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Sorry, the message format is wrong.\nUnable to issue a bot account on its own', id)
                    await aruga.sendTextWithMentions(from, `Request received, issued:\n${mentionedJidList.map(x => `@${x.replace('@c.us', '')}`).join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return await aruga.sendText(from, 'Failed, you cannot remove the group admin.')
                await aruga.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case 'promote':
        case 'ترقية':
            if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Sorry, can only promote 1 user', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Sorry, the user is already an admin.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Sorry, the message format is wrong.\nCannot promote own bot account', id)
            await aruga.promoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `comgratulation man @${mentionedJidList[0].replace('@c.us', '')} you are now admin.`)
            break
        case 'demote':
        case 'تخفيض':
            if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
            if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
            if (mentionedJidList.length !== 1) return aruga.reply(from, 'Sorry, only 1 user can be demonstrated', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await aruga.reply(from, 'Sorry, the user is not an admin yet.', id)
            if (mentionedJidList[0] === botNumber) return await aruga.reply(from, 'Sorry, the message format is wrong.\nUnable to demo bot account itself', id)
            await aruga.demoteParticipant(groupId, mentionedJidList[0])
            await aruga.sendTextWithMentions(from, `oh snap, i think you did something wrong @${mentionedJidList[0].replace('@c.us', '')} you are not admin anymore.`)
            break
        case 'bye':
            if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
            aruga.sendText(from, 'Good bye... ( ⇀‸↼‶ )').then(() => aruga.leaveGroup(groupId))
            break
        case 'del':
            if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
            if (!quotedMsg) return aruga.reply(from, `Sorry, the message format is wrong please.\nReply to bot messages with a caption ${prefix}del`, id)
            if (!quotedMsgObj.fromMe) return aruga.reply(from, `Sorry, the message format is wrong please.\nReply to bot messages with a caption ${prefix}del`, id)
            aruga.deleteMessage(quotedMsgObj.chatId, quotedMsgObj.id, false)
            break
        case 'tagall':
        case 'everyone':
        case 'منشن':
            if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
            if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
            const groupMem = await aruga.getGroupMembers(groupId)
            let hehex = '╔══✪〘 Mention All 〙✪══\n'
            for (let i = 0; i < groupMem.length; i++) {
                hehex += '╠➥'
                hehex += ` @${groupMem[i].id.replace(/@c.us/g, '')}\n`
            }
            hehex += '╚═〘 *S T I C K E R  B O T* 〙'
            await aruga.sendTextWithMentions(from, hehex)
            break
        case 'botstat': {
            const loadedMsg = await aruga.getAmountOfLoadedMessages()
            const chatIds = await aruga.getAllChatIds()
            const groups = await aruga.getAllGroups()
            aruga.sendText(from, `Status :\n- *${loadedMsg}* Loaded Messages\n- *${groups.length}* Group Chats\n- *${chatIds.length - groups.length}* Personal Chats\n- *${chatIds.length}* Total Chats`)
            break
        }

        //Owner Group
        case 'kickall': //mengeluarkan semua member
        if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
        let isOwner = chat.groupMetadata.owner == sender.id
        if (!isOwner) return aruga.reply(from, 'Sorry, this command can only be used by the group owner!', id)
        if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
            const allMem = await aruga.getGroupMembers(groupId)
            for (let i = 0; i < allMem.length; i++) {
                if (groupAdmins.includes(allMem[i].id)) {

                } else {
                    await aruga.removeParticipant(groupId, allMem[i].id)
                }
            }
            aruga.reply(from, 'Success kick all member', id)
        break

        //Owner Bot
        case 'ban':
            if (!isOwnerBot) return aruga.reply(from, 'This command is for Bot Owners only!', id)
            if (args.length == 0) return aruga.reply(from, `To ban someone from using commands\n\nHow to type: \n${prefix}ban add 628xx --to activate\n${prefix}ban del 628xx --to disable\n\nhow to quickly ban many groups type:\n${prefix}ban @tag @tag @tag`, id)
            if (args[0] == 'add') {
                banned.push(args[1]+'@c.us')
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'Success banned target!')
            } else
            if (args[0] == 'del') {
                let xnxx = banned.indexOf(args[1]+'@c.us')
                banned.splice(xnxx,1)
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'Success unbanned target!')
            } else {
             for (let i = 0; i < mentionedJidList.length; i++) {
                banned.push(mentionedJidList[i])
                fs.writeFileSync('./settings/banned.json', JSON.stringify(banned))
                aruga.reply(from, 'Success ban target!', id)
                }
            }
            break
        case 'bc': //untuk broadcast atau promosi
            if (!isOwnerBot) return aruga.reply(from, 'This command is for Boat Owners only!', id)
            if (args.length == 0) return aruga.reply(from, `To broadcast to all chats type:\n${prefix}bc [isi chat]`)
            let msg = body.slice(4)
            const chatz = await aruga.getAllChatIds()
            for (let idk of chatz) {
                var cvk = await aruga.getChatById(idk)
                if (!cvk.isReadOnly) aruga.sendText(idk, `〘 *A R U G A  B C* 〙\n\n${msg}`)
                if (cvk.isReadOnly) aruga.sendText(idk, `〘 *A R U G A  B C* 〙\n\n${msg}`)
            }
            aruga.reply(from, 'Broadcast Success!', id)
            break
        case 'leaveall': //mengeluarkan bot dari semua group serta menghapus chatnya
            if (!isOwnerBot) return aruga.reply(from, 'This command is for Boat Owners only', id)
            const allChatz = await aruga.getAllChatIds()
            const allGroupz = await aruga.getAllGroups()
            for (let gclist of allGroupz) {
                await aruga.sendText(gclist.contact.id, `Sorry the bot is cleaning, total chat active : ${allChatz.length}`)
                await aruga.leaveGroup(gclist.contact.id)
                await aruga.deleteChat(gclist.contact.id)
            }
            aruga.reply(from, 'Success leave all group!', id)
            break
        case 'clearall': //menghapus seluruh pesan diakun bot
            if (!isOwnerBot) return aruga.reply(from, 'This command is for Boat Owners only', id)
            const allChatx = await aruga.getAllChats()
            for (let dchat of allChatx) {
                await aruga.deleteChat(dchat.id)
            }
            aruga.reply(from, 'Success clear all chat!', id)
            break
            case 'onlyads':
            case 'قفل':
                if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)    
                await aruga.setGroupToAdminsOnly(groupId, true)
                await aruga.sendText(from, `Group is Set to admins only`)

                break
                case 'batterylevel':
                    const battery = await aruga.getBatteryLevel()
                    console.log(battery)
                    await aruga.sendText(from,battery.toString());
                break
                case 'allads':
                case 'فتح':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)    
                        await aruga.setGroupToAdminsOnly(groupId, false)
                        await aruga.sendText(from, `Group is Set to all participants`)
                break
                case 'revoke':
                case 'الغاء':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    if (!isBotGroupAdmins) return aruga.reply(from, 'Failed, please add the bot as a group admin!', id)
                    //if (onContactAdded) return aruga.reply(from, "now i will reset the group link", id)                     
                        await aruga.revokeGroupInviteLink(from, `${args[0]}@c.us`)
                        .then(() => aruga.reply(from, 'group link is revoked!', id))
                break
                case 'grouplink':
                case 'link':
                case 'رابط':
                    if (!isGroupMsg) return aruga.reply(from, 'Sorry, this command can only be used within groups!', id)
                    if (!isGroupAdmins) return aruga.reply(from, 'Slow down cowboy, this command can only be used by group admins!', id)
                    if (!isBotGroupAdmins) return aruga.reply(from, 'How do you expect me to do this without giving me admin privileges?', id)

                    try {
                        const grouplink = await aruga.getGroupInviteLink(from)
                        await aruga.reply(from, `The group invite link is ${grouplink}`, id);
                    } catch (e) {
                        console.error(e);
                        aruga.reply(from, 'Something went wrong.', id)
                    }
                    break
                        const response = await axios.get('https://iphonecake.com/app/');

                    if (response.data.includes('Revoked. Be right back.')) {
                
                        return aruga.sendText("it hasn't been updated yet!")
                    } else {
                        return true
                    }
                    const onMessageDeleted = await axios.get('https://iphonecake.com/app/');

                    if (onMessageDeleted.data.includes('deleted message')) {
                
                        return aruga.sendText("why would you delete it?")
                    } else {
                        return true
                    }
        default:
            console.log(color('[EROR]', 'red'), color(moment(t * 1000).format('DD/MM/YY HH:mm:ss'), 'yellow'), 'Unregistered Command from', color(pushname))
            break
        }
    } catch (err) {
        console.log(color('[EROR]', 'red'), err)
    }
}