import { expectCalledStrict, expectReturnedStrict } from '@mocks/testutils';
import { Time } from '@utils/constants';
import * as utils from '@utils/util';
import { Image } from 'canvas';
import { createReadStream } from 'fs';
import { resolve } from 'path';

describe('Utils', () => {
	describe('noop', () => {
		test('GIVEN function THEN matches function type', () => {
			expect(utils.noop).toEqual(expect.any(Function));
		});

		test('GIVEN call THEN should return undefined', () => {
			jest.spyOn(utils, 'noop');

			utils.noop();

			expectCalledStrict(utils.noop, 1);
			expectReturnedStrict(utils.noop, 1, undefined);
		});
	});

	describe('IMAGE_EXTENSION', () => {
		test('GIVEN valid extensions THEN passes test', () => {
			expect(utils.IMAGE_EXTENSION.test('.bmp')).toBe(true);
			expect(utils.IMAGE_EXTENSION.test('.jpg')).toBe(true);
			expect(utils.IMAGE_EXTENSION.test('.jpeg')).toBe(true);
			expect(utils.IMAGE_EXTENSION.test('.png')).toBe(true);
			expect(utils.IMAGE_EXTENSION.test('.gif')).toBe(true);
			expect(utils.IMAGE_EXTENSION.test('.webp')).toBe(true);
		});

		test('GIVEN extension without period THEN doesn\'t pass test', () => {
			expect(utils.IMAGE_EXTENSION.test('bmp')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('jpg')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('jpeg')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('png')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('gif')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('webp')).toBe(false);
		});

		test('GIVEN invalid extensions THEN doesn\'t pass test', () => {
			expect(utils.IMAGE_EXTENSION.test('.mp4')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('.mp3')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('.aac')).toBe(false);
			expect(utils.IMAGE_EXTENSION.test('.mkv')).toBe(false);
		});
	});

	describe('radians', () => {
		test('GIVEN 180 degrees THEN returns 1 Pi', () => {
			expect(utils.radians(180)).toEqual(Math.PI);
		});

		test('GIVEN 120 degrees THEN returns ⅔ Pi', () => {
			expect(utils.radians(120)).toEqual(Math.PI / 3 * 2);
		});

		test('GIVEN 360 degrees THEN returns 2 Pi', () => {
			expect(utils.radians(360)).toEqual(Math.PI * 2);
		});
	});

	describe('showSeconds', () => {
		test('GIVEN duration of string THEN returns 00:00', () => {
			// @ts-expect-error
			expect(utils.showSeconds('I am your father')).toEqual('00:00');
		});

		test('GIVEN duration of number THEN returns seconds', () => {
			expect(utils.showSeconds(Number(Time.Day))).toEqual('24:00:00');
		});

		test('GIVEN duration of number THEN returns seconds', () => {
			expect(utils.showSeconds(Number(Time.Second))).toEqual('00:01');
		});
	});

	describe('loadImage', () => {
		test('GIVEN valid path THEN sets buffer to image src', async () => {
			const filePath = resolve(__dirname, '..', '..', '..', 'tests', 'mocks', 'image.png');

			const image = await utils.loadImage(filePath);

			expect(image.width).toBe(32);
			expect(image.height).toBe(32);
		});
	});

	describe('streamToBuffer', () => {
		test('GIVEN path to file THEN converts to Buffer', async () => {
			const filePath = resolve(__dirname, '..', '..', '..', 'tests', 'mocks', 'image.png');
			const readStream = createReadStream(filePath);
			const buffer = await utils.streamToBuffer(readStream);

			const image = new Image();
			image.src = buffer;

			expect(image.width).toBe(32);
			expect(image.height).toBe(32);
		});
	});

	describe('resolveEmoji', () => {
		test('Full animated emoji', () => {
			expect(utils.resolveEmoji('<a:emoji:123456789101213145>')).toEqual('a:emoji:123456789101213145');
		});

		test('Full static emoji', () => {
			expect(utils.resolveEmoji('<:emoji:123456789101213145>')).toEqual(':emoji:123456789101213145');
		});

		test('Partial animated emoji', () => {
			expect(utils.resolveEmoji('a:emoji:123456789101213145')).toEqual('a:emoji:123456789101213145');
		});

		test('Partial static emoji', () => {
			expect(utils.resolveEmoji(':emoji:123456789101213145')).toEqual(':emoji:123456789101213145');
		});

		test('Box Emoji', () => {
			expect(utils.resolveEmoji('5\u20E3')).toEqual('5%E2%83%A3');
		});

		test('Twemoji Emoji', () => {
			expect(utils.resolveEmoji('😂')).toEqual('%F0%9F%98%82');
		});

		test('None emoji', () => {
			expect(utils.resolveEmoji('')).toBeNull();
		});

		test('GIVEN Animated Emoji Object THEN returns string references', () => {
			const emoji: utils.EmojiObject = {
				name: 'joy',
				id: '123-456-789',
				animated: true
			};

			expect(utils.resolveEmoji(emoji)).toEqual('a:joy:123-456-789');
		});

		test('GIVEN Static Emoji Object THEN returns string references', () => {
			const emoji: utils.EmojiObject = {
				name: 'joy',
				id: '123-456-789',
				animated: false
			};

			expect(utils.resolveEmoji(emoji)).toEqual(':joy:123-456-789');
		});

		test('GIVEN Emoji Object without ID THEN returns string references', () => {
			const emoji: utils.EmojiObject = {
				name: 'joy',
				id: null,
				animated: false
			};

			expect(utils.resolveEmoji(emoji)).toEqual('joy');
		});
	});

	describe('displayEmoji', () => {
		test('GIVEN custom emoji THEN returns emoji+id', () => {
			expect(utils.displayEmoji(':emoji:123456789101213145')).toEqual('<:emoji:123456789101213145>');
		});

		test('GIVEN twemoji THEN returns decoded URI Component', () => {
			expect(utils.displayEmoji('🤖')).toEqual('🤖');
		});
	});

	describe('compareEmoji', () => {
		test('GIVEN custom emoji with Emoji string THEN returns true', () => {
			expect(utils.compareEmoji(':emoji:123456789101213145', ':emoji:123456789101213145')).toEqual(true);
		});

		test('GIVEN custom emoji with non matching id THEN returns false', () => {
			expect(utils.compareEmoji(':emoji:123456789101213145', ':emoji:541312101987654321')).toEqual(false);
		});

		test('GIVEN custom emoji with non matching name THEN returns false', () => {
			expect(utils.compareEmoji(':emoji:123456789101213145', ':joy:123456789101213145')).toEqual(false);
		});

		test('GIVEN custom emoji with EmojiObjectPartial THEN compares to matching', () => {
			const emoji: utils.EmojiObjectPartial = {
				name: 'joy',
				id: '123456789101213145'
			};

			expect(utils.compareEmoji(':joy:123456789101213145', emoji)).toEqual(true);
		});

		test('GIVEN custom emoji with non matching EmojiObjectPartial THEN compares to matching', () => {
			const emoji: utils.EmojiObjectPartial = {
				name: 'joy',
				id: '123456789101213145'
			};

			expect(utils.compareEmoji(':joy:541312101987654321', emoji)).toEqual(false);
		});

		test('GIVEN custom emoji with non matching EmojiObjectPartial THEN compares to matching', () => {
			const emoji: utils.EmojiObjectPartial = {
				name: 'emoji',
				id: '123456789101213145'
			};

			expect(utils.compareEmoji(':joy:123456789101213145', emoji)).toEqual(false);
		});

		test('GIVEN regular emoji with matching emoji THEN compares to matching', () => {
			expect(utils.compareEmoji('%F0%9F%98%82', '😂')).toEqual(true);
		});

		test('GIVEN regular emoji with non-matching emoji THEN compares to matching', () => {
			expect(utils.compareEmoji('%F0%9F%98%82', '😀')).toEqual(false);
		});

		test('GIVEN regular emoji with non-matching emoji THEN compares to matching', () => {
			const emoji: utils.EmojiObjectPartial = {
				name: 'emoji',
				id: '123456789101213145'
			};

			expect(utils.compareEmoji('%F0%9F%98%82', emoji)).toEqual(false);
		});

		test('GIVEN regular emoji matching against custom emoji THEN compares to matching', () => {
			expect(utils.compareEmoji(':emoji:541312101987654321', '😀')).toEqual(false);
		});
	});

	describe('oneToTen', () => {
		test('GIVEN positive rational number THEN returns level 0 (😪)', () => {
			expect(utils.oneToTen(2 / 3)).toStrictEqual({ color: 5968128, emoji: '😪' });
		});

		test('GIVEN negative rational number THEN returns level 0 (😪)', () => {
			expect(utils.oneToTen(2 / 3)).toStrictEqual({ color: 5968128, emoji: '😪' });
		});

		test('GIVEN positive integer number THEN returns level 2 (😫)', () => {
			expect(utils.oneToTen(2)).toStrictEqual({ color: 11211008, emoji: '😫' });
		});

		test('GIVEN negative integer number THEN returns level 0 (😪)', () => {
			expect(utils.oneToTen(-5)).toStrictEqual({ color: 5968128, emoji: '😪' });
		});

		test('GIVEN positive integer over 10 THEN returns level 10 (😍)', () => {
			expect(utils.oneToTen(11)).toStrictEqual({ color: 5362927, emoji: '😍' });
		});
	});

	describe('splitText', () => {
		test('GIVEN text without spaces THEN hard cuts off', () => {
			expect(utils.splitText('thistexthasnospaces', 10)).toEqual('thistextha');
		});

		test('GIVEN text with spaces THEN cuts off on space', () => {
			expect(utils.splitText('thistext hasnospaces', 10)).toEqual('thistext');
		});
	});

	describe('cutText', () => {
		test('GIVEN text short text THEN doesn\'t truncate', () => {
			expect(utils.cutText("text that doesn't have to truncate", 35)).toEqual("text that doesn't have to truncate");
		});

		test('GIVEN text with spaces THEN cuts off on space', () => {
			expect(utils.cutText('text that does have to truncate', 10)).toEqual('text...');
		});

		test('GIVEN text with spaces THEN cuts off after space', () => {
			expect(utils.cutText('textthat does have to truncate', 10)).toEqual('texttha...');
		});
	});

	describe('twemoji', () => {
		test('GIVEN twemoji icon THEN returns identifier for maxcdn', () => {
			expect(utils.twemoji('😀')).toEqual('1f600');
		});
	});

	describe('parseRange', () => {
		test('GIVEN 1..5 THEN returns [1, 2, 3, 4, 5]', () => {
			expect(utils.parseRange('1..5')).toStrictEqual([1, 2, 3, 4, 5]);
		});

		test('GIVEN 1..5,10 THEN returns [1, 2, 3, 4, 5, 10]', () => {
			expect(utils.parseRange('1..5,10')).toStrictEqual([1, 2, 3, 4, 5, 10]);
		});

		test('GIVEN 1..5,10..12 THEN returns [1, 2, 3, 4, 5, 10, 11, 12]', () => {
			expect(utils.parseRange('1..5,10..12')).toStrictEqual([1, 2, 3, 4, 5, 10, 11, 12]);
		});

		test('GIVEN 20..22,10..12,10..15,60..57 THEN [20, 21, 22, 10, 11, 12, 13, 14, 15, 57, 58, 59, 60]', () => {
			expect(utils.parseRange('20..22,10..12,10..15,60..57')).toStrictEqual([20, 21, 22, 10, 11, 12, 13, 14, 15, 57, 58, 59, 60]);
		});

		test('GIVEN 1,2,2,2,1..2,2,2..1 THEN returns [1, 2]', () => {
			expect(utils.parseRange('1,2,2,2,1..2,2,2..1')).toStrictEqual([1, 2]);
		});

		test('GIVEN 1..3,2,6,0,9 THEN returns [1, 2, 3, 6, 9]', () => {
			expect(utils.parseRange('1..3,2,6,0,9')).toStrictEqual([1, 2, 3, 6, 9]);
		});

		test('GIVEN 1,2,3,6,10,12 THEN returns [1, 2, 3, 6, 10, 12]', () => {
			expect(utils.parseRange('1,2,3,6,10,12')).toStrictEqual([1, 2, 3, 6, 10, 12]);
		});

		test('GIVEN 1,   2, 3,   6, THEN returns [1, 2, 3, 6]', () => {
			expect(utils.parseRange('1,   2, 3,   6,')).toStrictEqual([1, 2, 3, 6]);
		});

		test('GIVEN 1,..,,   2, 3,   6, THEN returns [1, 2, 3, 6]', () => {
			expect(utils.parseRange('1,..,,   2, 3,   6,')).toStrictEqual([1, 2, 3, 6]);
		});

		test('GIVEN 1,..,,   2, 3, ..  6, THEN returns [1, 2, 3]', () => {
			expect(utils.parseRange('1,..,,   2, 3, ..  6,')).toStrictEqual([1, 2, 3]);
		});

		test('GIVEN 1,..,,   2, 3,4 ..  6, THEN returns [1, 2, 3, 4, 5, 6]', () => {
			expect(utils.parseRange('1,..,,   2, 3,4 ..  6,')).toStrictEqual([1, 2, 3, 4, 5, 6]);
		});
	});

	describe('parseUrL', () => {
		test('GIVEN valid URL THEN returns URL', () => {
			expect(utils.parseURL('https://skyra.pw')).toStrictEqual(new URL('https://skyra.pw'));
		});

		test('GIVEN invalid url THEN returns null', () => {
			expect(utils.parseURL('thisisnotaurl')).toBeNull();
		});
	});

	describe('roundNumber', () => {
		test('GIVEN number without decimals THEN returns number', () => {
			expect(utils.roundNumber(5)).toEqual(5);
		});

		test('GIVEN number with decimals that round down THEN returns floored number', () => {
			expect(utils.roundNumber(5.3346353526)).toEqual(5);
		});

		test('GIVEN number with decimals that round up THEN returns floored number + 1', () => {
			expect(utils.roundNumber(5.6556697864)).toEqual(6);
		});

		test('GIVEN number with positive exponent THEN returns exponent scaled number', () => {
			expect(utils.roundNumber('10e5')).toEqual(1000000);
		});

		test('GIVEN number with negative exponent THEN returns 0', () => {
			expect(utils.roundNumber('10e-5')).toEqual(0);
		});

		test('GIVEN number with negative exponent and many decimals THEN returns exponent scaled number', () => {
			expect(utils.roundNumber('10e-5', 10)).toEqual(0.0001);
		});
	});

	describe('inlineCodeblock', () => {
		test('GIVEN text THEN converts to inline codeblock', () => {
			expect(utils.inlineCodeblock('const skyraIsCool = true')).toEqual('`const skyraIsCool = true`');
		});
	});

	describe('createPick', () => {

		beforeAll(() => {
			// Mock out random so the result is predictable
			jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
		});

		afterAll(() => {
			(global.Math.random as any).mockRestore();
		});

		test('GIVEN simple picker THEN picks first value', () => {
			const picker = utils.createPick([1, 2, 3, 4]);
			expect(picker()).toEqual(1);
		});
	});

	describe('getFromPath', () => {
		const obj = {
			keyOne: 'valueOne',
			keyTwo: {
				nestedKeyOne: 'nestedValueOne'
			}
		};

		test('GIVEN object and existing root level key THEN returns value', () => {
			expect(utils.getFromPath(obj, 'keyOne')).toEqual('valueOne');
		});

		test('GIVEN object and non-existing root level key THEN returns undefined', () => {
			expect(utils.getFromPath(obj, 'keyThree')).toBeUndefined();
		});

		test('GIVEN object and existing nested level key THEN returns value', () => {
			expect(utils.getFromPath(obj, 'keyTwo.nestedKeyOne')).toEqual('nestedValueOne');
		});

		test('GIVEN object and non-existing nested level key THEN returns undefined', () => {
			expect(utils.getFromPath(obj, 'keyTwo.nestedKeyTwo')).toBeUndefined();
		});

		test('GIVEN object and string array path THEN returns undefined', () => {
			expect(utils.getFromPath(obj, ['keyTwo', 'nestedKeyOne'])).toEqual('nestedValueOne');
		});
	});

});
