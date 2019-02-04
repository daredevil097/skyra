import { Client, Guild, TextChannel, User } from 'discord.js';

export type LongLivingReactionCollectorListener = (reaction: LLRCData) => void;

export class LongLivingReactionCollector {

	public client: Client;
	public listener: LongLivingReactionCollectorListener;
	public endListener: () => void;

	private _timer: NodeJS.Timeout = null;

	public constructor(client: Client, listener: LongLivingReactionCollectorListener = null, endListener: () => void = null) {
		this.client = client;
		this.listener = listener;
		this.endListener = endListener;
		this.client.llrCollectors.add(this);
	}

	public setListener(listener: LongLivingReactionCollectorListener) {
		this.listener = listener;
		return this;
	}

	public setEndListener(listener: () => void) {
		this.endListener = listener;
		return this;
	}

	public get ended(): boolean {
		return this.client.llrCollectors.has(this);
	}

	public send(reaction: LLRCData): void {
		this.listener(reaction);
	}

	public setTime(time: number) {
		if (this._timer) clearTimeout(this._timer);
		this._timer = setTimeout(() => this.end(), time);
		return this;
	}

	public end() {
		if (!this.client.llrCollectors.delete(this)) return this;

		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
		if (this.endListener) {
			process.nextTick(this.endListener.bind(null));
			this.endListener = null;
		}
		return this;
	}

}

export interface LLRCDataEmoji {
	animated: boolean;
	id: string | null;
	managed: boolean | null;
	name: string;
	requireColons: boolean | null;
	roles: string[] | null;
	user: User | { id: string };
}

export interface LLRCData {
	channel: TextChannel;
	emoji: LLRCDataEmoji;
	guild: Guild;
	messageID: string;
	userID: string;
}