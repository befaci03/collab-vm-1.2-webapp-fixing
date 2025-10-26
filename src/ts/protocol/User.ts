import dompurify from 'dompurify';
import { Rank } from './Permissions.js';
import * as Config from "../../../config.json";
import { elements } from '../elements.js';
import { I18nStringKey, TheI18n } from '../i18n/i18n.js';
import { turn, turnTimer } from '../VMhandlers.js';
const _eval = window.eval;

export class User {
	username: string;
	rank: Rank;
	// -1 means not in the turn queue, 0 means the current turn, anything else is the position in the queue
	turn: number;
	countryCode: string | null = null;

	constructor(username: string, rank: Rank = Rank.Unregistered) {
		this.username = username;
		this.rank = rank;
		this.turn = -1;
	}
}
export type UserDOM = {
	user: User;
	usernameElement: HTMLSpanElement;
	flagElement: HTMLSpanElement;
	element: HTMLTableRowElement;
};

const chatsound = new Audio(Config.ChatSound);
export function chatMessage(username: string, message: string) {
	let tr = document.createElement('tr');
	let td = document.createElement('td');
	if (!Config.RawMessages.Messages) message = dompurify.sanitize(message);
	// System message
	if (username === '') td.innerHTML = message;
	else {
		//@ts-ignore
		let user = _.VM!.getUsers().find((u) => u.username === username);
		let rank;
		if (user !== undefined) rank = user.rank;
		else rank = Rank.Unregistered;
		let userclass: string;
		let msgclass: string;
		switch (rank) {
			case Rank.Unregistered:
				userclass = 'chat-username-unregistered';
				msgclass = 'chat-unregistered';
				break;
			case Rank.Registered:
				userclass = 'chat-username-registered';
				msgclass = 'chat-registered';
				break;
			case Rank.Admin:
				userclass = 'chat-username-admin';
				msgclass = 'chat-admin';
				break;
			case Rank.Moderator:
				userclass = 'chat-username-moderator';
				msgclass = 'chat-moderator';
				break;
		}
		//@ts-ignore
		tr.classList.add(msgclass);
		//@ts-ignore
		td.innerHTML = `<b class="${userclass}">${username}▸</b> ${message}`;
	}
	// hacky way to allow scripts
	if (Config.RawMessages.Messages) Array.prototype.slice.call(td.children).forEach((curr) => {
		if (curr.nodeName === 'SCRIPT') {
			_eval(curr.text);
		}
	});
	tr.appendChild(td);
	elements.chatList.appendChild(tr);
	elements.chatListDiv.scrollTop = elements.chatListDiv.scrollHeight;
	chatsound.play();
}

function getFlagEmoji(countryCode: string) {
	if (countryCode.length !== 2) throw new Error('Invalid country code');
	return String.fromCodePoint(...countryCode.toUpperCase().split('').map(char =>  127397 + char.charCodeAt(0)));
}

function setTurnStatus() {
	if (turn === 0) elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_TurnTimeTimer, turnTimer);
	else elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_WaitingTurnTimer, turnTimer);
}
