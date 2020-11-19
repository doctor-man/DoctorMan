const fs = require('fs-extra')
const {
    prefix
} = JSON.parse(fs.readFileSync('./settings/setting.json'))

/*

Dimohon untuk tidak menghapus link github saya, butuh support dari kalian! makasih.

*/

exports.textTnC = () => {
    return `
Source code / This bot is an open-source program (free) written using Javascript, you can use, copy, modify, combine, publish, distribute, sub-license, and or sell copies without removing the main author of the source code / bot.

By using this source code / bot, you agree to the following Terms and Conditions:
- The source code / bot does not store your data on our servers.
- Source code / bot is not responsible for your orders to this bot.
- Source code / your bot can be seen at https://github.com/ArugaZ

Instagram: https://instagram.com/ini.arga/

Best regards, ArugaZ.`
}

/*

Dimohon untuk tidak menghapus link github saya, butuh support dari kalian! makasih.

*/

exports.textMenu = (pushname) => {
    return `
Hey, ${pushname}! 👋️
look at all of these cool stuff that you can do man!!✨

Creator:
 *➥ ${prefix}sticker*
 *➥ ${prefix}stickergif*
 *➥ ${prefix}stickergiphy*
 *➥ ${prefix}meme*
 *➥ ${prefix}quotemaker*

Download:
 *➥ ${prefix}instagram*


other stuff in the Bot:
 *➥ ${prefix}donate*
 *➥ ${prefix}ownerbot*

_-_-_-_-_-_-_-_-_-_-_-_-_-_

Hope you have a great day!✨`
}

/*

Dimohon untuk tidak menghapus link github saya, butuh support dari kalian! makasih.

*/

exports.textAdmin = () => {
    return `
⚠ [ *Owner Group Only* ] ⚠
Here are the group owner features on this bot!
➥ *${prefix}kickall*
-owner is the group creator.

⚠ [ *Admin Group Only* ] ⚠ 
Following are the group admin features available on this bot!

➥ *${prefix}add*
➥ *${prefix}kick* @tag
➥ *${prefix}promote* @tag
➥ *${prefix}demote* @tag
➥ *${prefix}tagall*
➥ *${prefix}del*
`
}

/*

Dimohon untuk tidak menghapus link github saya, butuh support dari kalian! makasih.

*/

exports.textDonasi = () => {
    return `
Hi, thanks for using this bot, to support this bot you can help by donating by:

➥ https://Paypal.me/SalemAbdullah1

Pray that the bot project will continue to grow
Pray for more creative ideas for the bot author

The donation will be used for the development and operation of this bot.

Thanks.`
}

//Download:
//➥ *${prefix}instagram*
//➥ *${prefix}ig*
//➥ *${prefix}ytmp3*
//➥ *${prefix}ytmp4*

//Search Any:
//➥ *${prefix}images*
//➥ *${prefix}sreddit*
//➥ *${prefix}resep*
//➥ *${prefix}stalkig*
//➥ *${prefix}wiki*
//➥ *${prefix}cuaca*
//➥ *${prefix}chord*
//➥ *${prefix}ss*
//➥ *${prefix}play*
//➥ *${prefix}whatanime*

//Random Images:
//➥ *${prefix}anime*
//➥ *${prefix}kpop*
//➥ *${prefix}memes*

//Owner Bot:
//*${prefix}ban* - banned➥
//*${prefix}bc* - promosi➥
//*${prefix}leaveall* - exit all groups➥
//*${prefix}clearall* - delete all chats➥