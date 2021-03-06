import { Events } from '@lib/types/Enums';
import { isTrackEndEvent, isTrackExceptionEvent, isTrackStuckEvent, isWebSocketClosedEvent, LavalinkEvent, isTrackStartEvent } from '@utils/LavalinkUtils';
import { Colors, Event, EventStore } from 'klasa';

export default class extends Event {

	private kHeader = new Colors({ text: 'magenta' }).format('[LAVALINK]');

	public constructor(store: EventStore, file: string[], directory: string) {
		super(store, file, directory, {
			emitter: store.client.lavalink!,
			event: 'event'
		});
	}

	public run(payload: LavalinkEvent) {
		if (typeof payload.guildId !== 'string') return;

		const manager = this.client.guilds.get(payload.guildId)?.music;
		if (typeof manager === 'undefined') return;

		if (isTrackEndEvent(payload)) {
			return this.client.emit(Events.LavalinkEnd, manager, payload);
		}

		if (isTrackStartEvent(payload)) {
			return this.client.emit(Events.LavalinkStart, manager, payload);
		}

		if (isTrackExceptionEvent(payload)) {
			return this.client.emit(Events.LavalinkException, manager, payload);
		}

		if (isTrackStuckEvent(payload)) {
			return this.client.emit(Events.LavalinkStuck, manager, payload);
		}

		if (isWebSocketClosedEvent(payload)) {
			return this.client.emit(Events.LavalinkWebsocketClosed, manager, payload);
		}

		this.client.emit(Events.Wtf, `${this.kHeader} OP code not recognized: ${payload.op}`);
		this.client.emit(Events.Error, `           Payload: ${JSON.stringify(payload)}`);
	}

}
