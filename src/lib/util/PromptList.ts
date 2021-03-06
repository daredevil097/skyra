import { Message } from 'discord.js';
import { util } from 'klasa';

const kPromptOptions = { time: 30000, dispose: true, max: 1 };
const kAttempts = 5;

/**
 * Run the prompt
 * @param message The message that runs this prompt
 * @param entries The entries to resolve
 */
export async function prompt(message: Message, entries: PromptListResolvable) {
	const n = await ask(message, [...resolve(entries, 10)]);
	await Promise.all(message.responses.map(response => response.nuke().catch(() => null)));
	return n;
}

/**
 * Retrieve the number via prompts
 * @param message The message that runs this prompt
 * @param list The list to show
 * @private
 */
async function ask(message: Message, list: readonly string[]) {
	const possibles = list.length;
	const codeblock = util.codeBlock('asciidoc', list.join('\n'));
	const responseMessage = await message.channel.sendLocale('PROMPTLIST_MULTIPLE_CHOICE', [codeblock, possibles]);
	const abortOptions = message.language.tget('TEXT_PROMPT_ABORT_OPTIONS');
	const promptFilter = (m: Message) => m.author === message.author
		&& (abortOptions.includes(m.content.toLowerCase()) || !Number.isNaN(Number(m.content)));
	let response: Message | null = null;
	let n: number | undefined = undefined;
	let attempts = 0;
	do {
		if (attempts !== 0) await message.sendLocale('PROMPTLIST_ATTEMPT_FAILED', [codeblock, attempts, kAttempts]);
		response = await message.channel.awaitMessages(promptFilter, kPromptOptions)
			.then(responses => responses.size ? responses.first()! : null);

		if (response) {
			if (response.deletable) response.nuke().catch(() => null);
			if (abortOptions.includes(response.content.toLowerCase())) throw message.language.tget('PROMPTLIST_ABORTED');
			n = Number(response.content);
			if (!Number.isNaN(n) && n >= 1 && n <= possibles) {
				await responseMessage.delete();
				break;
			}
		}
	} while (response && attempts++ < kAttempts);

	if (!response || attempts >= kAttempts) throw null;
	return (n ?? 0) - 1;
}

function *resolve(data: PromptListResolvable, maxLength: number): Iterable<string> {
	let i = 0;
	for (const entry of data) {
		if (typeof entry === 'string') yield `${(i + 1).toString().padStart(2, ' ')} :: ${entry}`;
		else if (Array.isArray(entry)) yield `${(i + 1).toString().padStart(2, ' ')} :: ${entry.join(' : ')}`;

		if (++i >= maxLength) break;
	}
}

type PromptListResolvable = Iterable<string> | Iterable<[string, string]>;
