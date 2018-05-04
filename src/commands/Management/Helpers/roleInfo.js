const { Command, MessageEmbed, Permissions: { FLAGS } } = require('../../../index');

module.exports = class extends Command {

	constructor(...args) {
		super(...args, {
			botPerms: ['EMBED_LINKS'],
			cooldown: 10,
			description: msg => msg.language.get('COMMAND_ROLEINFO_DESCRIPTION'),
			extendedHelp: msg => msg.language.get('COMMAND_ROLEINFO_EXTENDED'),
			permLevel: 6,
			runIn: ['text'],
			usage: '[role:rolename]'
		});
	}

	run(msg, [role = msg.member.roles.highest]) {
		const i18n = msg.language, { permissions } = role, { COMMAND_ROLEINFO_TITLES } = i18n.language;
		return msg.sendEmbed(new MessageEmbed()
			.setColor(role.color || 0xDFDFDF)
			.setTitle(`${role.name} [${role.id}]`)
			.setDescription(i18n.get('COMMAND_ROLEINFO', role))
			.addField(COMMAND_ROLEINFO_TITLES.PERMISSIONS, permissions.has(FLAGS.ADMINISTRATOR)
				? i18n.get('COMMAND_ROLEINFO_ALL')
				: i18n.get('COMMAND_ROLEINFO_PERMISSIONS', permissions.toArray())));
	}

};