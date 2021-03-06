import { GuildSettings } from '@lib/types/settings/GuildSettings';
import { Argument, KlasaMessage, Possible } from 'klasa';
import { Track } from 'lavalink';

export default class extends Argument {

	public async run(arg: string, _: Possible, message: KlasaMessage) {
		if (!arg) {
			if (message.guild && message.guild.music.queue.length) return null;
			throw message.language.tget('MUSICMANAGER_FETCH_NO_ARGUMENTS');
		}
		if (!message.guild) return null;

		const remainingUserEntries = this.getRemainingUserEntries(message);
		if (remainingUserEntries === 0) throw message.language.tget('MUSICMANAGER_TOO_MANY_SONGS');

		arg = arg.replace(/^<(.+)>$/g, '$1');
		const parsedURL = this.parseURL(arg);
		let returnAll = false;
		let tracks: Track[] = [];
		let soundcloud = true;
		if (parsedURL) {
			tracks = await this.fetchSongs(message, remainingUserEntries, arg);
			returnAll = parsedURL.playlist;
		} else if (Reflect.has(message.flagArgs, 'sc') || Reflect.has(message.flagArgs, 'soundcloud')) {
			tracks = await this.fetchSongs(message, remainingUserEntries, `scsearch: ${arg}`);
			returnAll = false;
			soundcloud = false;
		} else {
			tracks = await this.fetchSongs(message, remainingUserEntries, `ytsearch: ${arg}`);
			returnAll = false;
		}
		if (!tracks.length) {
			if (soundcloud) tracks.push(...await this.fetchSongs(message, remainingUserEntries, `scsearch: ${arg}`));
			if (!tracks.length) throw message.language.tget('MUSICMANAGER_FETCH_NO_MATCHES');
		}
		return returnAll ? tracks : [tracks[0]];
	}

	public parseURL(url: string): { url: string; playlist: boolean } | null {
		try {
			const parsed = new URL(url);
			return parsed.protocol && parsed.hostname && (parsed.protocol === 'https:' || parsed.protocol === 'http:')
				? { url: parsed.href, playlist: parsed.searchParams.has('list') }
				: null;
		} catch (error) {
			return null;
		}
	}

	private async fetchSongs(message: KlasaMessage, remainingUserEntries: number, search: string) {
		try {
			return this.filter(message, remainingUserEntries, await message.guild!.music.fetch(search));
		} catch {
			return [];
		}
	}

	private getRemainingUserEntries(message: KlasaMessage) {
		const maximumEntriesPerUser = message.guild!.settings.get(GuildSettings.Music.MaximumEntriesPerUser);
		const userEntries = message.guild!.music.queue.reduce((acc, song) => song.requester === message.author.id ? acc + 1 : acc, 0) +
			(message.guild!.music.song?.requester === message.author.id ? 1 : 0);
		return Math.max(0, maximumEntriesPerUser - userEntries);
	}

	private filter(message: KlasaMessage, remainingUserEntries: number, tracks: Track[]) {
		if (message.member!.isDJ) return tracks.slice(0, remainingUserEntries);

		const maximumDuration = message.guild!.settings.get(GuildSettings.Music.MaximumDuration);
		const allowStreams = message.guild!.settings.get(GuildSettings.Music.AllowStreams);

		return tracks
			.filter(track => (allowStreams ? true : track.info.isStream) && track.info.length <= maximumDuration)
			.slice(0, remainingUserEntries);
	}

}
