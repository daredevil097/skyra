import { FlattenedMusicHandler } from '@utils/Models/ApiTransform';

export const enum IncomingWebsocketAction {
	Authenticate = 'AUTHENTICATE',
	MusicQueueUpdate = 'MUSIC_QUEUE_UPDATE',
	SubscriptionUpdate = 'SUBSCRIPTION_UPDATE'
}

export const enum OutgoingWebsocketAction {
	Authenticate = 'AUTHENTICATE',
	MusicAdd = 'MUSIC_ADD',
	MusicConnect = 'MUSIC_CONNECT',
	MusicLeave = 'MUSIC_LEAVE',
	MusicPrune = 'MUSIC_PRUNE',
	MusicRemove = 'MUSIC_REMOVE',
	MusicReplayUpdate = 'MUSIC_REPLAY_UPDATE',
	MusicShuffleQueue = 'MUSIC_SHUFFLE_QUEUE',
	MusicSongFinish = 'MUSIC_SONG_FINISH',
	MusicSongPause = 'MUSIC_SONG_PAUSE',
	MusicSongPlay = 'MUSIC_SONG_PLAY',
	MusicSongReplay = 'MUSIC_SONG_REPLAY',
	MusicSongResume = 'MUSIC_SONG_RESUME',
	MusicSongSeekUpdate = 'MUSIC_SONG_SEEK_UPDATE',
	MusicSongSkip = 'MUSIC_SONG_SKIP',
	MusicSongVolumeUpdate = 'MUSIC_SONG_VOLUME_UPDATE',
	MusicVoiceChannelJoin = 'MUSIC_VOICE_CHANNEL_JOIN',
	MusicVoiceChannelLeave = 'MUSIC_VOICE_CHANNEL_LEAVE',
	MusicSync = 'MUSIC_SYNC'
}

export const enum MusicAction {
	SkipSong = 'SKIP_SONG',
	AddSong = 'ADD_SONG',
	DeleteSong = 'DELETE_SONG',
	PauseSong = 'PAUSE_SONG',
	ResumePlaying = 'RESUME_PLAYING'
}

export const enum SubscriptionAction {
	Subscribe = 'SUBSCRIBE',
	Unsubscribe = 'UNSUBSCRIBE'
}

export const enum SubscriptionName {
	Music = 'MUSIC',
	Something = 'SOMETHING'
}

export interface MusicSubscription {
	type: SubscriptionName.Music;
	guild_id: string;
}

export interface ExampleSubscription {
	type: SubscriptionName.Something;
	something: string;
}

export type Subscription = MusicSubscription | ExampleSubscription;

export const enum CloseCodes {
	ProtocolError = 1002,
	PolicyViolation = 1008,
	InternalError = 1011,
	Unauthorized = 4301,
}

export interface IncomingDataObject {
	token?: string;
	user_id?: string;
	music_action?: MusicAction;
	subscription_action?: SubscriptionAction;
	subscription_name?: SubscriptionName;
	guild_id?: string;
}

export interface IncomingWebsocketMessage {
	action: IncomingWebsocketAction;
	data: IncomingDataObject;
}

export interface OutgoingWebsocketMessage {
	action?: OutgoingWebsocketAction;
	data?: Partial<FlattenedMusicHandler>;
	error?: string;
	success?: boolean;
}

export interface UserAuthObject {
	user_id: number;
	token: string;
}
