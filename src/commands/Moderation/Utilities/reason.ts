import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { Events, PermissionLevels } from '@lib/types/Enums';
import { ApplyOptions } from '@skyra/decorators';
import { KlasaMessage } from 'klasa';
import { getImage } from '@utils/util';

@ApplyOptions<SkyraCommandOptions>({
	cooldown: 5,
	description: language => language.tget('COMMAND_REASON_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_REASON_EXTENDED'),
	permissionLevel: PermissionLevels.Moderator,
	requiredPermissions: ['EMBED_LINKS'],
	runIn: ['text'],
	usage: '<range:range{,50}> <reason:...string>',
	usageDelim: ' '
})
export default class extends SkyraCommand {

	public async init() {
		this.createCustomResolver('range', async (arg, possible, message) => {
			if (arg === 'latest') return [await message.guild!.moderation.count()];
			return this.client.arguments.get('range')!.run(arg, possible, message);
		});
	}

	public async run(message: KlasaMessage, [cases, reason]: [number[], string]) {
		const entries = await message.guild!.moderation.fetch(cases);
		if (!entries.size) throw message.language.tget(cases.length === 1 ? 'MODERATION_CASE_NOT_EXISTS' : 'MODERATION_CASES_NOT_EXIST');

		const imageURL = getImage(message);
		await this.client.queries.updateModerationLogReasonBulk(message.guild!.id, entries.map(ml => ml.case!), reason);
		await message.guild!.moderation.fetchChannelMessages();
		for (const entry of entries.values()) {
			const clone = entry.clone();
			entry.setReason(reason);
			if (imageURL) entry.setImageURL(imageURL);
			this.client.emit(Events.ModerationEntryEdit, clone, entry);
		}

		return message.alert(message.language.tget('COMMAND_REASON_UPDATED', cases, reason));
	}

}
