import { multicollab } from "./main.js";
import Config from '../../config.json';

export async function loadList() {
	var jsonVMs = Config.ServerAddressesListURI === null ? [] : await (await fetch(Config.ServerAddressesListURI)).json();
	await Promise.all(
		[Config.ServerAddresses, jsonVMs].flat().map((url) => {
			return multicollab(url);
		})
	);

	// automatically join the vm that's in the url if it exists in the node list
	let v = vms.find((v) => v.id === window.location.hash.substring(1));
	try {
		if (v !== undefined) await openVM(v);
	} catch (e) {
		alert((e as Error).message);
	}
}

export function sortVMList() {
	cards.sort((a, b) => {
		return a.children[0].getAttribute('data-cvm-node')! > b.children[0].getAttribute('data-cvm-node')! ? 1 : -1;
	});
	elements.vmlist.children[0].innerHTML = '';
	cards.forEach((c) => elements.vmlist.children[0].appendChild(c));
}

export function sortUserList() {
	users.sort((a, b) => {
		if (a.user.username === w.username && a.user.turn >= b.user.turn && b.user.turn !== 0) return -1;
		if (b.user.username === w.username && b.user.turn >= a.user.turn && a.user.turn !== 0) return 1;
		if (a.user.turn === b.user.turn) return 0;
		if (a.user.turn === -1) return 1;
		if (b.user.turn === -1) return -1;
		if (a.user.turn < b.user.turn) return -1;
		else return 1;
	});
	for (const user of users) {
		elements.userlist.removeChild(user.element);
		elements.userlist.appendChild(user.element);
	}
}