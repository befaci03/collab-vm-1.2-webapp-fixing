import { keycodeKeysyms, keyidentifier_keysym, OSK_keyMappings } from "./keys.js";

export default function GetKeysym(keyCode: number, key: string, location: number): number | null {
	let keysym = keysym_from_key_identifier(key, location) || keysym_from_keycode(keyCode, location);
	return keysym;
}

function keysym_from_key_identifier(identifier: string, location: number): number | null {
	if (!identifier) return null;

	let typedCharacter: string | undefined;

	// If identifier is U+xxxx, decode Unicode character
	const unicodePrefixLocation = identifier.indexOf('U+');
	if (unicodePrefixLocation >= 0) {
		const hex = identifier.substring(unicodePrefixLocation + 2);
		typedCharacter = String.fromCharCode(parseInt(hex, 16));
	} else if (identifier.length === 1) typedCharacter = identifier;
	else return get_keysym(keyidentifier_keysym[identifier], location);

	if (!typedCharacter) return null;

	const codepoint = typedCharacter.charCodeAt(0);
	return keysym_from_charcode(codepoint);
}

function get_keysym(keysyms: number[] | null, location: number): number | null {
	if (!keysyms) return null;
	return keysyms[location] || keysyms[0];
}

function keysym_from_charcode(codepoint: number): number | null {
	if (isControlCharacter(codepoint)) return 0xff00 | codepoint;
	if (codepoint >= 0x0000 && codepoint <= 0x00ff) return codepoint;
	if (codepoint >= 0x0100 && codepoint <= 0x10ffff) return 0x01000000 | codepoint;
	return null;
}

function isControlCharacter(codepoint: number): boolean {
	return codepoint <= 0x1f || (codepoint >= 0x7f && codepoint <= 0x9f);
}

function keysym_from_keycode(keyCode: number, location: number): number | null {
	return get_keysym(keycodeKeysyms[keyCode], location);
}

function key_identifier_sane(keyCode: number, keyIdentifier: string): boolean {
	if (!keyIdentifier) return false;
	const unicodePrefixLocation = keyIdentifier.indexOf('U+');
	if (unicodePrefixLocation === -1) return true;

	const codepoint = parseInt(keyIdentifier.substring(unicodePrefixLocation + 2), 16);
	if (keyCode !== codepoint) return true;
	if ((keyCode >= 65 && keyCode <= 90) || (keyCode >= 48 && keyCode <= 57)) return true;
	return false;
}

export function OSK_buttonToKeysym(button: string): number | null {
	const keyMapping = OSK_keyMappings.find((mapping) => mapping.includes(button));
	if (keyMapping) {
		const [, keyCode, keyIdentifier, key, location] = keyMapping;
		return GetKeysym(keyCode, key, location);
	}
	return null;
}
