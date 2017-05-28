const moment = require("moment");

/* eslint-disable no-underscore-dangle */
exports.run = async (client, msg, [twitchName]) => {
  try {
    const clientID = client.constants.getConfig.tokens.twitch;
    const { data } = await client.fetch.JSON(`https://api.twitch.tv/kraken/channels/${twitchName}?client_id=${clientID}`);
    const creationDate = moment(data.created_at).format("DD-MM-YYYY");
    const embed = new client.methods.Embed()
      .setColor(6570406)
      .setDescription([
        `**Game**: ${data.game}`,
        `**Status**: ${data.status}`,
        `**Followers**: ${data.followers}`,
      ].join("\n"))
      .setThumbnail(data.logo)
      .setAuthor(`${data.display_name} (${data._id})`, "https://i.imgur.com/OQwQ8z0.jpg", data.url)
      .addField("Created On", creationDate, true)
      .addField("Channel Views", data.views, true);
    await msg.sendEmbed(embed);
  } catch (e) {
    msg.send("Unable to find account. Did you spell it correctly?");
  }
};

exports.conf = {
  enabled: true,
  runIn: ["text", "dm", "group"],
  aliases: [],
  permLevel: 0,
  botPerms: [],
  requiredFuncs: [],
  spam: false,
  mode: 1,
  cooldown: 30,
};

exports.help = {
  name: "twitch",
  description: "Returns information on a Twitch.tv Account",
  usage: "<name:str>",
  usageDelim: "",
};