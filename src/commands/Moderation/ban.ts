import { isNumber } from '@klasa/utils';
import { ModerationCommand, ModerationCommandOptions } from '@lib/structures/ModerationCommand';
import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { ApplyOptions } from '@skyra/decorators';
import { Moderation } from '@utils/constants';
import { ArgumentTypes, getImage } from '@utils/util';
import { KlasaMessage } from 'klasa';

@ApplyOptions<ModerationCommandOptions>({
	aliases: ['b'],
	description: language => language.tget('COMMAND_BAN_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_BAN_EXTENDED'),
	optionalDuration: true,
	requiredMember: false,
	requiredGuildPermissions: ['BAN_MEMBERS']
})
export default class extends ModerationCommand {

	public prehandle(...[message]: ArgumentTypes<ModerationCommand['prehandle']>) {
		return message.guild!.settings.get(GuildSettings.Events.BanAdd) ? { unlock: message.guild!.moderation.createLock() } : null;
	}

	public handle(...[message, context]: ArgumentTypes<ModerationCommand['handle']>) {
		return message.guild!.security.actions.ban({
			user_id: context.target.id,
			moderator_id: message.author.id,
			duration: context.duration,
			image_url: getImage(message),
			reason: context.reason
		}, this.getDays(message), this.getTargetDM(message, context.target));
	}

	public posthandle(...[, { preHandled }]: ArgumentTypes<ModerationCommand<Moderation.Unlock>['posthandle']>) {
		if (preHandled) preHandled.unlock();
	}

	public async checkModeratable(...[message, context]: ArgumentTypes<ModerationCommand<Moderation.Unlock>['checkModeratable']>) {
		const member = await super.checkModeratable(message, context);
		if (member && !member.bannable) throw message.language.tget('COMMAND_BAN_NOT_BANNABLE');
		return member;
	}

	private getDays(message: KlasaMessage) {
		const regex = message.language.tget('COMMAND_MODERATION_DAYS');
		for (const [key, value] of Object.entries(message.flagArgs)) {
			if (regex.test(key)) {
				const parsed = Number(value);
				if (isNumber(parsed) && parsed >= 0 && parsed <= 7) return parsed;
			}
		}
		return 0;
	}

}
