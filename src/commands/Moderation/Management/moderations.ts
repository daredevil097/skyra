import { Collection } from '@discordjs/collection';
import { ModerationManagerEntry } from '@lib/structures/ModerationManagerEntry';
import { RichDisplayCommand, RichDisplayCommandOptions } from '@lib/structures/RichDisplayCommand';
import { UserRichDisplay } from '@lib/structures/UserRichDisplay';
import { PermissionLevels } from '@lib/types/Enums';
import { ApplyOptions } from '@skyra/decorators';
import { BrandingColors, Moderation } from '@utils/constants';
import { getColor } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage, KlasaUser, util } from 'klasa';

@ApplyOptions<RichDisplayCommandOptions>({
	aliases: ['moderation'],
	bucket: 2,
	cooldown: 10,
	description: language => language.tget('COMMAND_MODERATIONS_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_MODERATIONS_EXTENDED'),
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['MANAGE_MESSAGES'],
	runIn: ['text'],
	usage: '<mutes|warnings|all:default> [user:username]'
})
export default class extends RichDisplayCommand {

	public async run(message: KlasaMessage, [action, target]: ['mutes' | 'warnings' | 'all', KlasaUser?]) {
		const response = await message.sendEmbed(new MessageEmbed()
			.setDescription(message.language.tget('SYSTEM_LOADING'))
			.setColor(BrandingColors.Secondary));

		const entries = (await (target ? message.guild!.moderation.fetch(target.id) : message.guild!.moderation.fetch()))
			.filter(this.getFilter(action, target));
		if (!entries.size) throw message.language.tget('COMMAND_MODERATIONS_EMPTY');

		const display = new UserRichDisplay(new MessageEmbed()
			.setColor(getColor(message))
			.setAuthor(this.client.user!.username, this.client.user!.displayAvatarURL({ size: 128, format: 'png', dynamic: true }))
			.setTitle(message.language.tget('COMMAND_MODERATIONS_AMOUNT', entries.size)));

		// Fetch usernames
		const usernames = await (target ? this.fetchAllModerators(entries) : this.fetchAllUsers(entries));

		// Set up the formatter
		const durationDisplay = message.language.duration.bind(message.language);
		const displayName = action === 'all';
		const format = target
			? this.displayModerationLogFromModerators.bind(this, usernames, durationDisplay, displayName)
			: this.displayModerationLogFromUsers.bind(this, usernames, durationDisplay, displayName);

		for (const page of util.chunk([...entries.values()], 10)) {
			display.addPage((template: MessageEmbed) => {
				for (const entry of page) {
					const field = format(entry);
					template.addField(field.name, field.value);
				}
			});
		}

		await display.start(response, message.author.id);
		return response;
	}

	private displayModerationLogFromModerators(users: Map<string, string>, duration: DurationDisplay, displayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const expired = remainingTime !== null && remainingTime <= 0;
		const formattedModerator = users.get(entry.flattenedModerator);
		const formattedReason = entry.reason || 'None';
		const formattedDuration = remainingTime === null ? '' : expired ? `\nExpired ${duration(-remainingTime)} ago.` : `\nExpires in: ${duration(remainingTime)}`;
		const formattedValue = `Moderator: **${formattedModerator}**.\n${formattedReason}${formattedDuration}`;
		return {
			name: displayName ? `${entry.case} | ${entry.title}` : `${entry.case}`,
			value: expired ? `~~${formattedValue.replace(/(^)?~~($)?/g, (_, start, end) => `${start ? '\u200B' : ''}~\u200B~${end ? '\u200B' : ''}`)}~~` : formattedValue
		};
	}

	private displayModerationLogFromUsers(users: Map<string, string>, duration: DurationDisplay, displayName: boolean, entry: ModerationManagerEntry) {
		const remainingTime = entry.duration === null || entry.createdAt === null ? null : (entry.createdAt + entry.duration) - Date.now();
		const expired = remainingTime !== null && remainingTime <= 0;
		const formattedUser = users.get(entry.flattenedUser);
		const formattedReason = entry.reason || 'None';
		const formattedDuration = remainingTime === null ? '' : `\nExpires in: ${duration(remainingTime)}`;
		const formattedValue = `User: **${formattedUser}**.\n${formattedReason}${formattedDuration}`;
		return {
			name: displayName ? `${entry.case} | ${entry.title}` : `${entry.case}`,
			value: expired ? `~~${formattedValue.replace(/(^)?~~($)?/g, (_, start, end) => `${start ? '\u200B' : ''}~\u200B~${end ? '\u200B' : ''}`)}~~` : formattedValue
		};
	}

	private async fetchAllUsers(entries: Collection<number, ModerationManagerEntry>) {
		const users = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedUser;
			if (!users.has(id)) users.set(id, await this.client.userTags.fetchUsername(id));
		}
		return users;
	}

	private async fetchAllModerators(entries: Collection<number, ModerationManagerEntry>) {
		const moderators = new Map() as Map<string, string>;
		for (const entry of entries.values()) {
			const id = entry.flattenedModerator;
			if (!moderators.has(id)) moderators.set(id, await this.client.userTags.fetchUsername(id));
		}
		return moderators;
	}

	private getFilter(type: 'mutes' | 'warnings' | 'all', target: KlasaUser | undefined) {
		switch (type) {
			case 'mutes':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Mute)
						&& !entry.invalidated && !entry.appealType;
			case 'warnings':
				return target
					? (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.isType(Moderation.TypeCodes.Warn)
						&& !entry.invalidated && !entry.appealType;
			default:
				return target
					? (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType && entry.flattenedUser === target.id
					: (entry: ModerationManagerEntry) => entry.duration !== null
						&& !entry.invalidated && !entry.appealType;
		}
	}

}

type DurationDisplay = (time: number) => string;
