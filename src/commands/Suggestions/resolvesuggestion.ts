import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import type { SuggestionData } from '@lib/types/definitions/Suggestion';
import { PermissionLevels } from '@lib/types/Enums';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { ApplyOptions } from '@skyra/decorators';
import { MessageEmbed, TextChannel } from 'discord.js';
import type { KlasaMessage } from 'klasa';

const enum SuggestionsColors {
	Accepted = 0x4CB02C,
	Considered = 0xCFA08D,
	Denied = 0xF90505
}

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['resu'],
	cooldown: 10,
	description: language => language.tget('COMMAND_RESOLVESUGGESTION_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_RESOLVESUGGESTION_EXTENDED'),
	flagSupport: true,
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['EMBED_LINKS'],
	runIn: ['text'],
	usage: '<suggestion:suggestion> <accept|a|deny|d|consider|c> [comment:comment]',
	usageDelim: ' '
})
export default class extends SkyraCommand {

	public async run(message: KlasaMessage, [suggestionData, action, comment]: [SuggestionData, string, string | undefined]) {
		const [shouldDM, shouldHideAuthor, shouldRepostSuggestion] = [
			message.guild!.settings.get(GuildSettings.Suggestions.OnAction.DM),
			message.guild!.settings.get(GuildSettings.Suggestions.OnAction.HideAuthor),
			message.guild!.settings.get(GuildSettings.Suggestions.OnAction.RepostMessage)
		];
		const [suggestion] = suggestionData.message.embeds;

		let newEmbed = new MessageEmbed();
		let messageContent = '';

		const author = await this.getAuthor(message, shouldHideAuthor);
		const actions = message.language.tget('COMMAND_RESOLVESUGGESTION_ACTIONS');
		const DMActions = message.language.tget('COMMAND_RESOLVESUGGESTION_ACTIONS_DMS');

		switch (action) {
			case 'a':
			case 'accept':
				messageContent = DMActions.ACCEPT(author, message.guild!.name);
				newEmbed = suggestion
					.setColor(SuggestionsColors.Accepted)
					.addField(actions.ACCEPT(author), comment);
				break;
			case 'c':
			case 'consider':
				messageContent = DMActions.CONSIDER(author, message.guild!.name);
				newEmbed = suggestion
					.setColor(SuggestionsColors.Considered)
					.addField(actions.CONSIDER(author), comment);
				break;
			case 'd':
			case 'deny':
				messageContent = DMActions.DENY(author, message.guild!.name);
				newEmbed = suggestion
					.setColor(SuggestionsColors.Denied)
					.addField(actions.DENY(author), comment);
				break;
		}

		if (shouldDM && messageContent !== null) {
			try {
				await suggestionData.author!.send(messageContent, { embed: newEmbed });
			} catch {
				await message.channel.sendLocale('COMMAND_RESOLVESUGGESTION_DM_FAIL');
			}
		}

		shouldRepostSuggestion
			? await suggestionData.message.channel.send(messageContent, { embed: newEmbed })
			: await suggestionData.message.edit(newEmbed);

		return message.sendLocale('COMMAND_RESOLVESUGGESTION_SUCCESS', [suggestionData.id, action]);
	}

	public async inhibit(message: KlasaMessage) {
		// If the message that triggered this is not this command (potentially help command) or the guild is null, return with no error.
		if (message.command !== this || message.guild === null) return true;

		const channelID = message.guild.settings.get(GuildSettings.Suggestions.SuggestionsChannel);
		if (channelID !== null) return false;
		await message.sendLocale('COMMAND_SUGGEST_NOSETUP', [message.author.username]);
		return true;
	}

	public async init() {
		this.createCustomResolver('suggestion', async (arg, _, message): Promise<SuggestionData> => {
			const channelID = message.guild!.settings.get(GuildSettings.Suggestions.SuggestionsChannel);
			if (!channelID) throw message.language.tget('COMMAND_SUGGEST_NOSETUP', message.author.username);
			const channel = this.client.channels.get(channelID) as TextChannel;
			const id = Number(arg);
			if (!Number.isInteger(id) || id < 1) throw message.language.tget('COMMAND_RESOLVESUGGESTION_INVALID_ID');
			const suggestionData = await this.client.queries.fetchSuggestion(message.guild!.id, id);
			if (suggestionData === null) throw message.language.tget('COMMAND_RESOLVESUGGESTION_ID_NOT_FOUND');
			const suggestionMessage = await channel.messages.fetch(suggestionData.message_id);
			if (typeof suggestionMessage === 'undefined') {
				await this.client.queries.deleteSuggestion(message.guild!.id, id);
				throw message.language.tget('COMMAND_RESOLVESUGGESTION_MESSAGE_NOT_FOUND');
			}
			const suggestionAuthor = await this.client.users.fetch(suggestionData.author_id).catch(() => null);
			return {
				message: suggestionMessage,
				author: suggestionAuthor,
				id
			};
		});

		this.createCustomResolver('comment', (arg, possible, message) => {
			if (typeof arg === 'undefined') return message.language.tget('COMMAND_RESOLVESUGGESTION_DEFAULT_COMMENT');
			return this.client.arguments.get('...string')!.run(arg, possible, message);
		});
	}

	private async getAuthor(message: KlasaMessage, hideAuthor: boolean) {
		if (Reflect.has(message.flagArgs, 'show-author') || Reflect.has(message.flagArgs, 'showAuthor')) return message.author.tag;
		if (Reflect.has(message.flagArgs, 'hide-author') || Reflect.has(message.flagArgs, 'hideAuthor') || hideAuthor) {
			return await message.hasAtLeastPermissionLevel(PermissionLevels.Administrator)
				? message.language.tget('COMMAND_RESOLVESUGGESTION_AUTHOR_ADMIN')
				: message.language.tget('COMMAND_RESOLVESUGGESTION_AUTHOR_MODERATOR');
		}
		return message.author.tag;
	}

}
