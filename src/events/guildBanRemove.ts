import { Guild, User } from 'discord.js';
import { Event } from 'klasa';
import { GuildSettings } from '../lib/types/namespaces/GuildSettings';
import { ModerationTypeKeys } from '../lib/util/constants';

export default class extends Event {

	public async run(guild: Guild, user: User) {
		if (!guild.available || !guild.settings.get(GuildSettings.Events.BanRemove)) return;
		await guild.moderation.waitLock();
		await guild.moderation.new
			.setType(ModerationTypeKeys.UnBan)
			.setUser(user)
			.create();
	}

}