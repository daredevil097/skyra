const { readFile } = require("fs-nextra");
const Canvas = require("canvas");
const { join, resolve } = require("path");

const template = resolve(join(__dirname, "../../assets/images/memes/cuddle.png"));

const Cuddle = async (client, msg, user) => {
  /* Initialize Canvas */
    const c = new Canvas(636, 366);
    const background = new Canvas.Image();
    const user1 = new Canvas.Image();
    const user2 = new Canvas.Image();
    const ctx = c.getContext("2d");

    if (user.id === msg.author.id) user = client.user;

  /* Get the buffers from both profile avatars */
    const [bgBuffer, user1Buffer, user2Buffer] = await Promise.all([
        readFile(template),
        client.funcs.wrappers.fetchAvatar(msg.author, 256),
        client.funcs.wrappers.fetchAvatar(user, 256),
    ]);

    const coord1 = { center: [238, 63], radius: 70 };
    const coord2 = { center: [377, 111], radius: 69 };

    /* Background */
    background.onload = () => ctx.drawImage(background, 0, 0, 636, 366);
    background.src = bgBuffer;

    /* Man */
    ctx.save();
    ctx.beginPath();
    ctx.arc(coord1.center[0], coord1.center[1], coord1.radius, 0, Math.PI * 2, false);
    ctx.clip();
    user1.onload = () => ctx.drawImage(user1, coord1.center[0] - coord1.radius, coord1.center[1] - coord1.radius, coord1.radius * 2, coord1.radius * 2);
    user1.src = user1Buffer;
    ctx.restore();

    /* Woman */
    ctx.save();
    ctx.beginPath();
    ctx.arc(coord2.center[0], coord2.center[1], coord2.radius, 0, Math.PI * 2, false);
    ctx.clip();
    user2.onload = () => ctx.drawImage(user2, coord2.center[0] - coord2.radius, coord2.center[1] - coord2.radius, coord2.radius * 2, coord2.radius * 2);
    user2.src = user2Buffer;
    ctx.restore();

    /* Resolve Canvas buffer */
    return c.toBuffer();
};

exports.run = async (client, msg, [search]) => {
    const user = await client.funcs.search.User(search, msg.guild);
    const output = await Cuddle(client, msg, user);
    return msg.channel.send({ files: [{ attachment: output, name: "Cuddle.png" }] });
};

exports.conf = {
    enabled: true,
    runIn: ["text"],
    aliases: [],
    permLevel: 0,
    botPerms: [],
    requiredFuncs: [],
    spam: false,
    mode: 0,
    cooldown: 30,
};

exports.help = {
    name: "cuddle",
    description: "Cuddle somebody!",
    usage: "<user:string>",
    usageDelim: "",
    extendedHelp: "",
};
