const { fetchJson } = require('../utils/fetcher')

/**
 * Get Resi Information
 *
 * @param {string} ekspedisi - nama ekpedisi
 * @param {string} resi - no / kode resi
 */
module.exports = cekResi = (ekspedisi, resi) => new Promise((resolve, reject) => {
    fetchJson(`https://api.terhambar.com/resi?resi=${resi}&kurir=${ekspedisi}`)
        .then((result) => {
            if (result.status.code != 200 && result.status.description != 'OK') return resolve(result.status.description)
                // eslint-disable-next-line camelcase
            const { result: { summary, details, delivery_status, manifest } } = result
            const manifestText = manifest.map(x => `⏰ ${x.manifest_date} ${x.manifest_time}\n └ ${x.manifest_description}`)
            const resultText = `
📦 Expedition Data
├ ${summary.courier_name}
├ Nomor: ${summary.waybill_number}
├ Service: ${summary.service_code}
└ Dikirim Pada: ${details.waybill_date}  ${details.waybill_time}
      
💁🏼‍♂️ Sender data
├ Nama: ${details.shippper_name}
└ Alamat: ${details.shipper_address1} ${details.shipper_city}
      
🎯 Recipient Data
├ Nama: ${details.receiver_name}
└ Alamat: ${details.receiver_address1} ${details.receiver_city}
      
📮 Delivery Status
└ ${delivery_status.status}
                 
🚧 POD Details\n
${manifestText.join('\n')}`
            resolve(resultText)
        }).catch((err) => {
            console.error(err)
            reject(err)
        })
})