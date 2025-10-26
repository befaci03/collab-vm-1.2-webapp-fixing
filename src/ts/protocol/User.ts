import dompurify from 'dompurify';
import { Rank } from './Permissions.js';
import * as Config from "../../../config.json";
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

const chatsound = new Audio(Config.ChatSound);
export function chatMessage(_:any, username: string, message: string) {
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
	_.elements.chatList.appendChild(tr);
	_.elements.chatListDiv.scrollTop = _.elements.chatListDiv.scrollHeight;
	chatsound.play();
}
