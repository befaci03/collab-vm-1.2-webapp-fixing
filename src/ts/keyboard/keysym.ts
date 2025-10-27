import { keycodeKeysyms, keyidentifier_keysym, OSK_keyMappings } from "./keys.js";
// TODO: make this MORE clear because it's so hard (maybe rewriting?)

export default function GetKeysym(keyCode: number, key: string, location: number): number | null {
	return getKeysymFromIdentifier(key, location) ?? getKeysymFromKeycode(keyCode, location);
}

function getKeysymFromIdentifier(identifier: string, location: number): number | null {
	if (!identifier) return null;

	// If identifier is U+xxxx, decode Unicode character
	if (identifier.startsWith("U+")) {
		const codepoint = parseInt(identifier.slice(2), 16);
		return getKeysymFromCharcode(codepoint);
	}
	else if (identifier.length === 1) return getKeysymFromCharcode(identifier.charCodeAt(0)); // single character handling
	else return getKeysymFromMapping(keyidentifier_keysym[identifier], location); // handle identifiers (like Shift Enter etc)
}

function getKeysymFromMapping(keysyms: number[] | null, location: number): number | null {
	if (!keysyms) return null;
	return keysyms[location] ?? keysyms[0];
}

function getKeysymFromCharcode(codepoint: number): number | null {
	//? some hex shit
	if (isControlCharacter(codepoint)) return 0xff00 | codepoint;
	if (codepoint <= 0x00ff) return codepoint;
	if (codepoint <= 0x10ffff) return 0x01000000 | codepoint;
	return null;
}

function isControlCharacter(codepoint: number): boolean {
	return codepoint <= 0x1f || (codepoint >= 0x7f && codepoint <= 0x9f);
}

function getKeysymFromKeycode(keyCode: number, location: number): number | null {
	return getKeysymFromMapping(keycodeKeysyms[keyCode], location);
}

export function OSK_buttonToKeysym(button: string): number | null {
	const keyMapping = OSK_keyMappings.find((mapping) => mapping.includes(button));
	if (keyMapping) {
		const [, keyCode, , key, location] = keyMapping;
		return GetKeysym(keyCode, key, location);
	}
	return null;
}
