export let VM: CollabVMClient | null = null;
import CollabVMClient from "./protocol/CollabVMClient";
import { Format } from './format.js';
import { elements } from "./main";
import { TheI18n } from "./i18n/i18n";
import TurnStatus from './protocol/TurnStatus.js';
import * as kblayout from './keyboard/layout.js';
import { User, chatMessage } from './protocol/User.js';
import VoteStatus from './protocol/VoteStatus.js';
import * as Config from "../../config.json";

let expectedClose: boolean = false;


let turnInterval: number | undefined = undefined;
let voteInterval: number | undefined = undefined;

const enableOSK = (enable: boolean) => {
	const theme = `simple-keyboard hg-theme-default cvmDark ${enable ? '' : 'cvmDisabled'} hg-layout-default`;
	[kblayout.keyboard, kblayout.keyboardControlPad, kblayout.keyboardArrows, kblayout.keyboardNumPad, kblayout.keyboardNumPadEnd].forEach((part) => {
		part.setOptions({
			theme: theme
		});
	});

	if (enable) kblayout.updateOSKStyle();
};

export async function openVM(elements:any, vm: typeof VM): Promise<void> {
	// If there's an active VM it must be closed before opening another
	if (VM !== null) return;
	expectedClose = false;
	// Set hash
    //@ts-ignore
	location.hash = vm.id;
	// Create the client
    //@ts-ignore
	VM = new CollabVMClient(vm.url);

	// Register event listeners
	VM!.on('chat', (username, message) => chatMessage(username, message));
	VM!.on('adduser', (user) => addUser(user));
	VM!.on('flag', () => flag());
	VM!.on('remuser', (user) => remUser(user));
	VM!.on('rename', (oldname, newname, selfrename) => userRenamed(oldname, newname, selfrename));

	VM!.on('renamestatus', (status) => {
		// TODO: i18n these
		switch (status) {
			case 'taken':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameTaken));
				break;
			case 'invalid':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameInvalid));
				break;
			case 'blacklisted':
				alert(TheI18n.GetString(I18nStringKey.kError_UsernameBlacklisted));
				break;
		}
	});

	VM!.on('turn', (status) => turnUpdate(status));
	VM!.on('vote', (status: VoteStatus) => voteUpdate(status));
	VM!.on('voteend', () => voteEnd());
	VM!.on('votecd', (voteCooldown) => window.alert(TheI18n.GetString(I18nStringKey.kVM_VoteCooldownTimer, voteCooldown)));
	VM!.on('login', (rank: Rank, perms: Permissions) => onLogin(rank, perms));

	VM!.on('close', () => {
		if (!expectedClose) alert(TheI18n.GetString(I18nStringKey.kError_UnexpectedDisconnection));
		closeVM();
	});

	// auth
	VM!.on('auth', async server => {
		elements.changeUsernameBtn.style.display = "none";
		if (Config.Auth.Enabled && Config.Auth.APIEndpoint === server && auth!.account) {
			VM!.loginAccount(auth!.account.sessionToken);
		} else if (!Config.Auth.Enabled || Config.Auth.APIEndpoint !== server) {
			auth = new AuthManager(server);
			await renderAuth();
		}
	});

	// Wait for the client to open
	await VM!.WaitForOpen();

	// Connect to node
    //@ts-ignore
	chatMessage('', `<b>${vm.id}</b><hr>`);
	let username = Config.Auth.Enabled ? (auth!.account?.username ?? null) : localStorage.getItem('username');
    //@ts-ignore
	let connected = await VM.connect(vm.id, username);
    //@ts-ignore
	elements.adminInputVMID.value = vm.id;
    //@ts-ignore
	w.VMName = vm.id;
	if (!connected) {
		closeVM();
		throw new Error('Failed to connect to node');
	}
	// Set the title
    //@ts-ignore
	document.title = Format('{0} - {1}', vm.id, TheI18n.GetString(I18nStringKey.kGeneric_CollabVM));
	// Append canvas
	elements.vmDisplay.appendChild(VM!.canvas);
	// Switch to the VM view
	elements.vmlist.style.display = 'none';
	elements.vmview.style.display = 'block';
	return;
}

export function closeVM() {
	if (VM === null) return;
	expectedClose = true;
	// Close the VM
	VM.close();
	VM = null;
	document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);
	turn = -1;
	// Remove the canvas
	elements.vmDisplay.innerHTML = '';
	// Switch to the VM list
	elements.vmlist.style.display = 'block';
	elements.vmview.style.display = 'none';
	// Clear users
	users.splice(0, users.length);
	elements.userlist.innerHTML = '';
	rank = Rank.Unregistered;
	perms.set(0);
	w.VMName = null;
	// Reset admin and vote panels
	elements.staffbtns.style.display = 'none';
	elements.restoreBtn.style.display = 'none';
	elements.rebootBtn.style.display = 'none';
	elements.bypassTurnBtn.style.display = 'none';
	elements.endTurnBtn.style.display = 'none';
	elements.clearQueueBtn.style.display = 'none';
	elements.qemuMonitorBtn.style.display = 'none';
	elements.indefTurnBtn.style.display = 'none';
	elements.ghostTurnBtn.style.display = 'none';
	elements.xssCheckboxContainer.style.display = 'none';
	elements.forceVotePanel.style.display = 'none';
	elements.voteResetPanel.style.display = 'none';
	elements.voteYesLabel.innerText = '0';
	elements.voteNoLabel.innerText = '0';
	elements.xssCheckbox.checked = false;
	elements.username.classList.remove('username-admin', 'username-moderator', 'username-registered');
	elements.username.classList.add('username-unregistered');
	// Reset rename button
	elements.changeUsernameBtn.style.display = "inline-block";
	// Reset auth if it was changed by the VM
	if (Config.Auth.Enabled && auth?.apiEndpoint !== Config.Auth.APIEndpoint) {
		auth = new AuthManager(Config.Auth.APIEndpoint);
		renderAuth();
	} else if (auth && !Config.Auth.Enabled) {
		auth = null;
		elements.accountDropdownMenuLink.style.display = "none";
	}
}

function addUser(user: User) {
	let olduser = users.find((u) => u.user === user);
	if (olduser !== undefined) elements.userlist.removeChild(olduser.element);
	let tr = document.createElement('tr');
	tr.setAttribute('data-cvm-turn', '-1');
	let td = document.createElement('td');
	let flagSpan = document.createElement('span');
	let usernameSpan = document.createElement('span');
	flagSpan.classList.add("userlist-flag");
	usernameSpan.classList.add("userlist-username");
	td.appendChild(flagSpan);
	if (user.countryCode !== null) {
		flagSpan.innerHTML = getFlagEmoji(user.countryCode);
		flagSpan.title = TheI18n.getCountryName(user.countryCode);
	};
	td.appendChild(usernameSpan);
	usernameSpan.innerText = user.username;
	switch (user.rank) {
		case Rank.Admin:
			tr.classList.add('user-admin');
			break;
		case Rank.Moderator:
			tr.classList.add('user-moderator');
			break;
		case Rank.Registered:
			tr.classList.add('user-registered');
			break;
		case Rank.Unregistered:
			tr.classList.add('user-unregistered');
			break;
	}
	if (user.username === w.username) tr.classList.add('user-current');
	tr.appendChild(td);
	let u = { user: user, element: tr, usernameElement: usernameSpan, flagElement: flagSpan };
	if (rank === Rank.Admin || rank === Rank.Moderator) userModOptions(u);
	elements.userlist.appendChild(tr);
	if (olduser !== undefined) olduser.element = tr;
	else users.push(u);
	elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
}

function remUser(user: User) {
	let olduser = users.findIndex((u) => u.user === user);
	if (olduser !== undefined) elements.userlist.removeChild(users[olduser].element);
	elements.onlineusercount.innerHTML = VM!.getUsers().length.toString();
	users.splice(olduser, 1);
}

function flag() {
	for (let user of users.filter(u => u.user.countryCode !== null)) {
		user.flagElement.innerHTML = getFlagEmoji(user.user.countryCode!);
		user.flagElement.title = TheI18n.getCountryName(user.user.countryCode!);
	}
}

function userRenamed(oldname: string, newname: string, selfrename: boolean) {
	let user = users.find((u) => u.user.username === newname);
	if (user) {
		user.usernameElement.innerHTML = newname;
	}
	if (selfrename) {
		w.username = newname;
		elements.username.innerText = newname;
		localStorage.setItem('username', newname);
	}
}

function turnUpdate(status: TurnStatus) {
	// Clear all turn data
	turn = -1;
	VM!.canvas.classList.remove('focused', 'waiting');
	clearInterval(turnInterval);
	turnTimer = 0;
	for (const user of users) {
		user.element.classList.remove('user-turn', 'user-waiting');
		user.element.setAttribute('data-cvm-turn', '-1');
	}
	elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_TakeTurn);
	enableOSK(false);

	if (status.user !== null) {
		let el = users.find((u) => u.user === status.user)!.element;
		el!.classList.add('user-turn');
		el!.setAttribute('data-cvm-turn', '0');
	}
	for (const user of status.queue) {
		let el = users.find((u) => u.user === user)!.element;
		el!.classList.add('user-waiting');
		el.setAttribute('data-cvm-turn', status.queue.indexOf(user).toString(10));
	}
	if (status.user?.username === w.username) {
		turn = 0;
		turnTimer = status.turnTime! / 1000;
		elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
		VM!.canvas.classList.add('focused');
		enableOSK(true);
	}
	if (status.queue.some((u) => u.username === w.username)) {
		turn = status.queue.findIndex((u) => u.username === w.username) + 1;
		turnTimer = status.queueTime! / 1000;
		elements.turnBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
		VM!.canvas.classList.add('waiting');
	}
	if (turn === -1) elements.turnstatus.innerText = '';
	else {
		//@ts-ignore
		turnInterval = setInterval(() => turnIntervalCb(), 1000);
		setTurnStatus();
	}
	sortUserList();
}

function voteUpdate(status: VoteStatus) {
	clearInterval(voteInterval);
	elements.voteResetPanel.style.display = 'block';
	elements.voteYesLabel.innerText = status.yesVotes.toString();
	elements.voteNoLabel.innerText = status.noVotes.toString();
	voteTimer = Math.floor(status.timeToEnd / 1000);
	//@ts-ignore
	voteInterval = setInterval(() => updateVoteEndTime(), 1000);
	updateVoteEndTime();
}

function updateVoteEndTime() {
	voteTimer--;
	elements.voteTimeText.innerText = TheI18n.GetString(I18nStringKey.kVM_VoteForResetTimer, voteTimer);
	if (voteTimer === 0) clearInterval(voteInterval);
}

function voteEnd() {
	clearInterval(voteInterval);
	elements.voteResetPanel.style.display = 'none';
}

function turnIntervalCb() {
	turnTimer--;
	setTurnStatus();
}
