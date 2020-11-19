const { create, Client } = require('@open-wa/wa-automate')
const figlet = require('figlet')
const options = require('./utils/options')
const { color, messageLog } = require('./utils')
const HandleMsg = require('./HandleMsg')

const start = (aruga = new Client()) => {
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('BOT', { font: 'Ghost', horizontalLayout: 'default' })))
    console.log(color(figlet.textSync('----------------', { horizontalLayout: 'default' })))
    console.log(color('[DEV]'), color("Salem's", 'yellow'))
    console.log(color('[~>>]'), color('BOT Started!', 'green'))

    // Mempertahankan sesi agar tetap nyala
    aruga.onStateChanged((state) => {
        console.log(color('[~>>]', 'red'), state)
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') aruga.forceRefocus()
    })

    // ketika bot diinvite ke dalam group
    aruga.onAddedToGroup(async(chat) => {
        const groups = await aruga.getAllGroups()
            // kondisi ketika batas group bot telah tercapai,ubah di file settings/setting.json
        if (groups.length > groupLimit) {
            await aruga.sendText(chat.id, `i can't join i have so many groups already\n: ${groupLimit}`).then(() => {
                aruga.leaveGroup(chat.id)
                aruga.deleteChat(chat.id)
            })
        } else {
            // kondisi ketika batas member group belum tercapai, ubah di file settings/setting.json
            if (chat.groupMetadata.participants.length < memberLimit) {
                await aruga.sendText(chat.id, `is this even a group? add me when you reach ${memberLimit} people`).then(() => {
                    aruga.leaveGroup(chat.id)
                    aruga.deleteChat(chat.id)
                })
            } else {
                await aruga.simulateTyping(chat.id, true).then(async() => {
                    await aruga.sendText(chat.id, `Hai minna~, Im BOT. To find out the commands on this bot type ${prefix}menu`)
                })
            }
        }
    })

    // ketika seseorang masuk/keluar dari group
    aruga.onGlobalParicipantsChanged(async(event) => {
        const host = await aruga.getHostNumber() + '@c.us';
        // kondisi ketika seseorang diinvite/join group lewat link
        //event = js object

        console.log(JSON.stringify(event))

        // kondisi ketika seseorang dikick/keluar dari group
        if (event.action == 'add' && event.who != host) {
            await aruga.sendTextWithMentions(event.chat, `welcome a board @${event.who.replace('@c.us', '')},\nhope you enjoy your stay with us`)

        } else if (event.action == 'remove' && event.who != host) {
            await aruga.sendTextWithMentions(event.chat, `ohh man, why did you leave! @${event.who.replace('@c.us', '')}, anyways we shall  meet again`)
        }

    })

    aruga.onIncomingCall(async(callData) => {
        // ketika seseorang menelpon nomor bot akan mengirim pesan
        await aruga.sendText(callData.peerJid, "are you seriously call me? i am a bot man!!.\n\n-i will have to block you now, bye!")
            .then(async() => {
                // bot akan memblock nomor itu
                await aruga.contactBlock(callData.peerJid)
            })
    })

    // ketika seseorang mengirim pesan
    aruga.onMessage(async(message) => {
        aruga.getAmountOfLoadedMessages() // menghapus pesan cache jika sudah 3000 pesan.
            .then((msg) => {
                if (msg >= 3000) {
                    console.log('[aruga]', color(`Loaded Message Reach ${msg}, cuting message cache...`, 'yellow'))
                    aruga.cutMsgCache()
                }
            })
        HandleMsg(aruga, message)
    })

    // Message log for analytic
    aruga.onAnyMessage((anal) => {
        messageLog(anal.fromMe, anal.type)
    })
}

// create session
create(options(true, start))
    .then((aruga) => start(aruga))
    .catch((err) => new Error(err))