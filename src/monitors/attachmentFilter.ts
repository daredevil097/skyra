import { MessageEmbed, Permissions } from 'discord.js';
import { KlasaMessage, Monitor } from 'klasa';
import { Events } from '../lib/types/Enums';
import { GuildSettings } from '../lib/types/namespaces/GuildSettings';
import { Adder } from '../lib/util/Adder';
import { MessageLogsEnum, ModerationTypeKeys } from '../lib/util/constants';
import { mute } from '../lib/util/util';
const { FLAGS } = Permissions;

export default class extends Monitor {

	public async run(message: KlasaMessage): Promise<void> {
		if (await message.hasAtLeastPermissionLevel(5)) return;

		const attachmentAction = message.guild.settings.get(GuildSettings.Selfmod.AttachmentAction) as GuildSettings.Selfmod.AttachmentAction;
		const attachmentMaximum = message.guild.settings.get(GuildSettings.Selfmod.AttachmentMaximum) as GuildSettings.Selfmod.AttachmentMaximum;
		const attachmentDuration = message.guild.settings.get(GuildSettings.Selfmod.AttachmentDuration) as GuildSettings.Selfmod.AttachmentDuration;

		if (!message.guild.security.adder) message.guild.security.adder = new Adder(attachmentMaximum, attachmentDuration);

		try {
			message.guild.security.adder.add(message.author.id, message.attachments.size);
			return;
		} catch (_) {
			switch (attachmentAction & 0b111) {
				case 0b000: await this.actionAndSend(message, ModerationTypeKeys.Warn, () =>
					null); break;
				case 0b001: await this.actionAndSend(message, ModerationTypeKeys.Kick, () =>
					message.member.kick()
						.catch((error) => this.client.emit(Events.ApiError, error))); break;
				case 0b010: await this.actionAndSend(message, ModerationTypeKeys.Mute, () =>
					mute(message.guild.me, message.member, 'AttachmentFilter: Threshold Reached.')
						.catch((error) => this.client.emit(Events.ApiError, error)), false); break;
				case 0b011: await this.actionAndSend(message, ModerationTypeKeys.Softban, () =>
					// @ts-ignore
					softban(message.guild, this.client.user, message.author, 'AttachmentFilter: Threshold Reached.', 1)
						.catch((error) => this.client.emit(Events.ApiError, error)), false); break;
				case 0b100: await this.actionAndSend(message, ModerationTypeKeys.Ban, () =>
					message.member.ban()
						.catch((error) => this.client.emit(Events.ApiError, error)));
			}
			if (attachmentAction & 0b1000) {
				this.client.emit(Events.GuildMessageLog, MessageLogsEnum.Moderation, message.guild, () => new MessageEmbed()
					.setColor(0xEFAE45)
					.setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ size: 128 }))
					// @ts-ignore
					.setFooter(`#${message.channel.name} | ${message.language.get('CONST_MONITOR_ATTACHMENTFILTER')}`)
					.setTimestamp());
			}
		}
	}

	/**
	 * @param message The message
	 * @param type The type
	 * @param performAction The action to perform
	 * @param createModerationLog Whether or not this should create a new moderation log entry
	 */
	public async actionAndSend(message: KlasaMessage, type: ModerationTypeKeys, performAction: () => Promise<unknown>, createModerationLog: boolean = true): Promise<void> {
		const lock = message.guild.moderation.createLock();
		await performAction();
		if (createModerationLog) {
			await message.guild.moderation.new
				.setModerator(this.client.user.id)
				.setUser(message.author.id)
				.setDuration(message.guild.settings.get(GuildSettings.Selfmod.AttachmentPunishmentDuration) as GuildSettings.Selfmod.AttachmentPunishmentDuration)
				.setReason('AttachmentFilter: Threshold Reached.')
				.setType(type)
				.create();
		}
		lock();
	}

	public shouldRun(message: KlasaMessage): boolean {
		if (!this.enabled || !message.guild || !message.attachments.size || message.author.id === this.client.user.id) return false;

		const attachment = message.guild.settings.get(GuildSettings.Selfmod.Attachment) as GuildSettings.Selfmod.Attachment;
		const attachmentAction = message.guild.settings.get(GuildSettings.Selfmod.AttachmentAction) as GuildSettings.Selfmod.AttachmentAction;
		const ignoreChannels = message.guild.settings.get(GuildSettings.Selfmod.IgnoreChannels) as GuildSettings.Selfmod.IgnoreChannels;
		if (!attachment || ignoreChannels.includes(message.channel.id)) return false;

		const guildMe = message.guild.me;

		switch (attachmentAction & 0b11) {
			case 0b000: return guildMe.roles.highest.position > message.member.roles.highest.position;
			case 0b001: return message.member.kickable;
			case 0b010: return message.guild.settings.get(GuildSettings.Roles.Muted)
				&& guildMe.roles.highest.position > message.member.roles.highest.position
				&& guildMe.permissions.has(FLAGS.MANAGE_ROLES);
			case 0b011: return message.member.bannable;
			case 0b100: return message.member.bannable;
			default: return false;
		}
	}

}