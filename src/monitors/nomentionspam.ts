// Copyright (c) 2018 BDISTIN. All rights reserved. MIT license.
import { KlasaMessage, Monitor } from 'klasa';

export default class extends Monitor {

	private roleValue = this.client.options.nms.role;
	private everyoneValue = this.client.options.nms.everyone;

	public async run(message: KlasaMessage): Promise<void> {
		if (!message.guild || !message.guild.settings.get('no-mention-spam.enabled')) return;

		const mentions = message.mentions.users.filter((user) => !user.bot && user !== message.author).size +
			(message.mentions.roles.size * this.roleValue) +
			(Number(message.mentions.everyone) * this.everyoneValue);

		if (!mentions) return;

		const rateLimit = message.guild.security.nms.acquire(message.author.id);

		try {
            for (let i = 0; i < mentions; i++) rateLimit.drip();
			// Reset time, don't let them relax
            rateLimit.resetTime();
			// @ts-ignore 2341
            if (message.guild.settings.get('no-mention-spam.alerts') && rateLimit.remaining / rateLimit.bucket < 0.2) {
                this.client.emit('mentionSpamWarning', message);
			}
		} catch (err) {
			this.client.emit('mentionSpamExceeded', message);
		}
	}

}
