import CollabVMClient from './protocol/CollabVMClient.js';
import iVM from './protocol/VM.js';
import Config from '../../config.json';
import { User, UserDOM } from './protocol/User.js';
import 'simple-keyboard/build/css/index.css';
import * as bootstrap from 'bootstrap';
import { I18nStringKey, TheI18n } from './i18n/i18n.js';
import { Format } from './utils/format.js';

import AuthManager, { auth, renderAuth, resetAuthVar } from './protocol/AuthManager.js';
import * as dompurify from 'dompurify';
import { closeVM, openVM, turn, turnTimer, users, VM, voteTimer } from './VMhandlers.js';
import { loadList, sortVMList, vms } from './listing.js';

// Elements
export const w = window as any;
export const elements = {
	vmlist: document.getElementById('vmlist') as HTMLDivElement,
	vmview: document.getElementById('vmview') as HTMLDivElement,
	vmDisplay: document.getElementById('vmDisplay') as HTMLDivElement,
	homeBtn: document.getElementById('homeBtn') as HTMLAnchorElement,
	rulesBtn: document.getElementById('rulesBtn') as HTMLAnchorElement,
	chatList: document.getElementById('chatList') as HTMLTableSectionElement,
	chatListDiv: document.getElementById('chatListDiv') as HTMLDivElement,
	userlist: document.getElementById('userlist') as HTMLTableSectionElement,
	onlineusercount: document.getElementById('onlineusercount') as HTMLSpanElement,
	username: document.getElementById('username') as HTMLSpanElement,
	chatinput: document.getElementById('chat-input') as HTMLInputElement,
	sendChatBtn: document.getElementById('sendChatBtn') as HTMLButtonElement,
	takeTurnBtn: document.getElementById('takeTurnBtn') as HTMLButtonElement,
	changeUsernameBtn: document.getElementById('changeUsernameBtn') as HTMLButtonElement,
	turnBtnText: document.getElementById('turnBtnText') as HTMLSpanElement,
	turnstatus: document.getElementById('turnstatus') as HTMLParagraphElement,
	osk: window.document.getElementById('oskBtn') as HTMLButtonElement,
	oskContainer: document.getElementById('osk-container') as HTMLDivElement,
	screenshotButton: document.getElementById('screenshotButton') as HTMLButtonElement,
	voteResetButton: document.getElementById('voteResetButton') as HTMLButtonElement,
	voteResetPanel: document.getElementById('voteResetPanel') as HTMLDivElement,
	voteYesBtn: document.getElementById('voteYesBtn') as HTMLButtonElement,
	voteNoBtn: document.getElementById('voteNoBtn') as HTMLButtonElement,
	voteYesLabel: document.getElementById('voteYesLabel') as HTMLSpanElement,
	voteNoLabel: document.getElementById('voteNoLabel') as HTMLSpanElement,
	voteTimeText: document.getElementById('voteTimeText') as HTMLSpanElement,
	loginModal: document.getElementById('loginModal') as HTMLDivElement,
	adminPassword: document.getElementById('adminPassword') as HTMLInputElement,
	loginButton: document.getElementById('loginButton') as HTMLButtonElement,
	adminInputVMID: document.getElementById('adminInputVMID') as HTMLInputElement,
	badPasswordAlert: document.getElementById('badPasswordAlert') as HTMLDivElement,
	incorrectPasswordDismissBtn: document.getElementById('incorrectPasswordDismissBtn') as HTMLButtonElement,
	ctrlAltDelBtn: document.getElementById('ctrlAltDelBtn') as HTMLButtonElement,
	toggleThemeBtn: document.getElementById('toggleThemeBtn') as HTMLAnchorElement,
	toggleThemeIcon: document.getElementById('toggleThemeIcon') as HTMLElement,
	toggleThemeBtnText: document.getElementById('toggleThemeBtnText') as HTMLSpanElement,
	// Admin
	staffbtns: document.getElementById('staffbtns') as HTMLDivElement,
	restoreBtn: document.getElementById('restoreBtn') as HTMLButtonElement,
	rebootBtn: document.getElementById('rebootBtn') as HTMLButtonElement,
	clearQueueBtn: document.getElementById('clearQueueBtn') as HTMLButtonElement,
	bypassTurnBtn: document.getElementById('bypassTurnBtn') as HTMLButtonElement,
	endTurnBtn: document.getElementById('endTurnBtn') as HTMLButtonElement,
	qemuMonitorBtn: document.getElementById('qemuMonitorBtn') as HTMLButtonElement,
	xssCheckboxContainer: document.getElementById('xssCheckboxContainer') as HTMLDivElement,
	xssCheckbox: document.getElementById('xssCheckbox') as HTMLInputElement,
	forceVotePanel: document.getElementById('forceVotePanel') as HTMLDivElement,
	forceVoteYesBtn: document.getElementById('forceVoteYesBtn') as HTMLButtonElement,
	forceVoteNoBtn: document.getElementById('forceVoteNoBtn') as HTMLButtonElement,
	indefTurnBtn: document.getElementById('indefTurnBtn') as HTMLButtonElement,
	ghostTurnBtn: document.getElementById('ghostTurnBtn') as HTMLButtonElement,
	ghostTurnBtnText: document.getElementById('ghostTurnBtnText') as HTMLSpanElement,
	qemuMonitorInput: document.getElementById('qemuMonitorInput') as HTMLInputElement,
	qemuMonitorSendBtn: document.getElementById('qemuMonitorSendBtn') as HTMLButtonElement,
	qemuMonitorOutput: document.getElementById('qemuMonitorOutput') as HTMLTextAreaElement,
	// Auth
	accountDropdownUsername: document.getElementById("accountDropdownUsername") as HTMLSpanElement,
	accountDropdownMenuLink: document.getElementById("accountDropdownMenuLink") as HTMLDivElement,
	accountLoginButton: document.getElementById("accountLoginButton") as HTMLAnchorElement,
	accountRegisterButton: document.getElementById("accountRegisterButton") as HTMLAnchorElement,
	accountSettingsButton: document.getElementById("accountSettingsButton") as HTMLAnchorElement,
	accountLogoutButton: document.getElementById("accountLogoutButton") as HTMLAnchorElement,
	accountModal: document.getElementById("accountModal") as HTMLDivElement,
	accountModalError: document.getElementById("accountModalError") as HTMLDivElement,
	accountModalErrorText: document.getElementById("accountModalErrorText") as HTMLSpanElement,
	accountModalErrorDismiss: document.getElementById("accountModalErrorDismiss") as HTMLButtonElement,
	accountModalSuccess: document.getElementById("accountModalSuccess") as HTMLDivElement,
	accountModalSuccessText: document.getElementById("accountModalSuccessText") as HTMLSpanElement,
	accountModalSuccessDismiss: document.getElementById("accountModalSuccessDismiss") as HTMLButtonElement,
	accountLoginSection: document.getElementById("accountLoginSection") as HTMLDivElement,
	accountRegisterSection: document.getElementById("accountRegisterSection") as HTMLDivElement,
	accountVerifyEmailSection: document.getElementById("accountVerifyEmailSection") as HTMLDivElement,
	accountVerifyEmailText: document.getElementById("accountVerifyEmailText") as HTMLParagraphElement,
	accountModalTitle: document.getElementById("accountModalTitle") as HTMLHeadingElement,
	accountLoginForm: document.getElementById("accountLoginForm") as HTMLFormElement,
	accountRegisterForm: document.getElementById("accountRegisterForm") as HTMLFormElement,
	accountVerifyEmailForm: document.getElementById("accountVerifyEmailForm") as HTMLFormElement,
	accountLoginCaptchaContainer: document.getElementById("accountLoginCaptchaContainer") as HTMLDivElement,
	accountLoginRecaptchaContainer: document.getElementById("accountLoginReCaptchaContainer") as HTMLDivElement,
	accountLoginTurnstileContainer: document.getElementById("accountLoginTurnstileContainer") as HTMLDivElement,
	accountRegisterCaptchaContainer: document.getElementById("accountRegisterCaptchaContainer") as HTMLDivElement,
	accountRegisterRecaptchaContainer: document.getElementById("accountRegisterReCaptchaContainer") as HTMLDivElement,
	accountRegisterTurnstileContainer: document.getElementById("accountRegisterTurnstileContainer") as HTMLDivElement,

	accountLoginUsername: document.getElementById("accountLoginUsername") as HTMLInputElement,
	accountLoginPassword: document.getElementById("accountLoginPassword") as HTMLInputElement,
	accountRegisterEmail: document.getElementById("accountRegisterEmail") as HTMLInputElement,
	accountRegisterUsername: document.getElementById("accountRegisterUsername") as HTMLInputElement,
	accountRegisterPassword: document.getElementById("accountRegisterPassword") as HTMLInputElement,
	accountRegisterConfirmPassword: document.getElementById("accountRegisterConfirmPassword") as HTMLInputElement,
	accountRegisterDateOfBirth: document.getElementById("accountRegisterDateOfBirth") as HTMLInputElement,
	accountVerifyEmailCode: document.getElementById("accountVerifyEmailCode") as HTMLInputElement,
	accountVerifyEmailPassword: document.getElementById("accountVerifyEmailPassword") as HTMLInputElement,

	accountSettingsSection: document.getElementById("accountSettingsSection") as HTMLDivElement,
	accountSettingsForm: document.getElementById("accountSettingsForm") as HTMLFormElement,
	accountSettingsEmail: document.getElementById("accountSettingsEmail") as HTMLInputElement,
	accountSettingsUsername: document.getElementById("accountSettingsUsername") as HTMLInputElement,
	accountSettingsNewPassword: document.getElementById("accountSettingsNewPassword") as HTMLInputElement,
	accountSettingsConfirmNewPassword: document.getElementById("accountSettingsConfirmNewPassword") as HTMLInputElement,
	accountSettingsCurrentPassword: document.getElementById("accountSettingsCurrentPassword") as HTMLInputElement,
	hideFlagCheckbox: document.getElementById("hideFlagCheckbox") as HTMLInputElement,

	accountResetPasswordSection: document.getElementById("accountResetPasswordSection") as HTMLDivElement,
	accountResetPasswordForm: document.getElementById("accountResetPasswordForm") as HTMLFormElement,
	accountResetPasswordEmail: document.getElementById("accountResetPasswordEmail") as HTMLInputElement,
	accountResetPasswordUsername: document.getElementById("accountResetPasswordUsername") as HTMLInputElement,
	accountResetPasswordCaptchaContainer: document.getElementById("accountResetPasswordCaptchaContainer") as HTMLDivElement,
	accountResetPasswordRecaptchaContainer: document.getElementById("accountResetPasswordReCaptchaContainer") as HTMLDivElement,
	accountResetPasswordTurnstileContainer: document.getElementById("accountResetPasswordTurnstileContainer") as HTMLDivElement,

	accountResetPasswordVerifySection: document.getElementById("accountResetPasswordVerifySection") as HTMLDivElement,
	accountVerifyPasswordResetText: document.getElementById("accountVerifyPasswordResetText") as HTMLParagraphElement,
	accountResetPasswordVerifyForm: document.getElementById("accountResetPasswordVerifyForm") as HTMLFormElement,
	accountResetPasswordCode: document.getElementById("accountResetPasswordCode") as HTMLInputElement,
	accountResetPasswordNewPassword: document.getElementById("accountResetPasswordNewPassword") as HTMLInputElement,
	accountResetPasswordConfirmNewPassword: document.getElementById("accountResetPasswordConfirmNewPassword") as HTMLInputElement,
	accountForgotPasswordButton: document.getElementById("accountForgotPasswordButton") as HTMLButtonElement,
};

// Listed VMs
export const cards: HTMLDivElement[] = [];

export async function multicollab(url: string) {
	// Create the client
	let client = new CollabVMClient(url);

	await client.WaitForOpen();

	// Get the list of VMs
	let list = await client.list();

	// Get the number of online users
	let online = client.getUsers().length;

	// Close the client
	client.close();

	// Add to the list
	vms.push(...list);

	// Add to the DOM
	for (let vm of list) {
		let div = document.createElement('div');
		div.classList.add('col-sm-5', 'col-md-3');
		let card = document.createElement('div');
		card.classList.add('card');
		//@ts-ignore
		if (Config.NSFWVMs.indexOf(vm.id) !== -1) card.classList.add('cvm-nsfw');
		card.setAttribute('data-cvm-node', vm.id);
		card.addEventListener('click', async () => {
			try {
				await openVM(vm);
			} catch (e) {
				alert((e as Error).message);
			}
		});
		vm.thumbnail.classList.add('card-img-top');
		let cardBody = document.createElement('div');
		cardBody.classList.add('card-body');
		let cardTitle = document.createElement('h5');
		cardTitle.innerHTML = Config.RawMessages.VMTitles ? vm.displayName : dompurify.sanitize(vm.displayName);
		let usersOnline = document.createElement('span');
		usersOnline.innerHTML = `(<i class="fa-solid fa-users"></i> ${online})`;
		cardBody.appendChild(cardTitle);
		cardBody.appendChild(usersOnline);
		card.appendChild(vm.thumbnail);
		card.appendChild(cardBody);
		div.appendChild(card);
		cards.push(div);
		sortVMList();
	}
}

function sendChat() {
	if (VM === null) return;
	if (elements.xssCheckbox.checked) VM.xss(elements.chatinput.value);
	else VM.chat(elements.chatinput.value);
	elements.chatinput.value = '';
}

// Bind list buttons
elements.homeBtn.addEventListener('click', () => closeVM());

// Bind VM view buttons
elements.sendChatBtn.addEventListener('click', sendChat);
elements.chatinput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') sendChat();
});
elements.changeUsernameBtn.addEventListener('click', () => {
	let oldname = w.username.nodeName === undefined ? w.username : w.username.innerText;
	let newname = prompt(TheI18n.GetString(I18nStringKey.kVMPrompts_EnterNewUsernamePrompt), oldname);
	if (newname === oldname) return;
	VM?.rename(newname);
});
elements.takeTurnBtn.addEventListener('click', () => {
	VM?.turn(turn === -1);
});
elements.screenshotButton.addEventListener('click', () => {
	if (!VM) return;
	VM.canvas.toBlob((blob) => {
		open(URL.createObjectURL(blob!), '_blank');
	});
});
elements.ctrlAltDelBtn.addEventListener('click', () => {
	if (!VM) return;
	// Ctrl
	VM?.key(0xffe3, true);
	// Alt
	VM?.key(0xffe9, true);
	// Del
	VM?.key(0xffff, true);
	// Ctrl
	VM?.key(0xffe3, false);
	// Alt
	VM?.key(0xffe9, false);
	// Del
	VM?.key(0xffff, false);
});
elements.voteResetButton.addEventListener('click', () => VM?.vote(true));
elements.voteYesBtn.addEventListener('click', () => VM?.vote(true));
elements.voteNoBtn.addEventListener('click', () => VM?.vote(false));
// Login
let usernameClick = false;
const loginModal = new bootstrap.Modal(elements.loginModal);
elements.loginModal.addEventListener('shown.bs.modal', () => elements.adminPassword.focus());
elements.username.addEventListener('click', () => {
	if (auth) return;
	if (!usernameClick) {
		usernameClick = true;
		setInterval(() => (usernameClick = false), 1000);
		return;
	}
	loginModal.show();
});
elements.loginButton.addEventListener('click', () => doLogin());
elements.adminPassword.addEventListener('keypress', (e) => e.key === 'Enter' && doLogin());
elements.incorrectPasswordDismissBtn.addEventListener('click', () => (elements.badPasswordAlert.style.display = 'none'));
function doLogin() {
	let adminPass = elements.adminPassword.value;
	if (adminPass === '') return;
	VM?.login(adminPass);
	elements.adminPassword.value = '';
	let u = VM?.on('login', () => {
		u!();
		loginModal.hide();
		elements.badPasswordAlert.style.display = 'none';
	});
	let _u = VM?.on('badpw', () => {
		_u!();
		elements.badPasswordAlert.style.display = 'block';
	});
}

// Admin buttons
elements.restoreBtn.addEventListener('click', () => window.confirm(TheI18n.GetString(I18nStringKey.kVMPrompts_AdminRestoreVMPrompt)) && VM?.restore());
elements.rebootBtn.addEventListener('click', () => VM?.reboot());
elements.clearQueueBtn.addEventListener('click', () => VM?.clearQueue());
elements.bypassTurnBtn.addEventListener('click', () => VM?.bypassTurn());
elements.endTurnBtn.addEventListener('click', () => {
	let user = VM?.getUsers().find((u) => u.turn === 0);
	if (user) VM?.endTurn(user.username);
});
elements.forceVoteNoBtn.addEventListener('click', () => VM?.forceVote(false));
elements.forceVoteYesBtn.addEventListener('click', () => VM?.forceVote(true));
elements.indefTurnBtn.addEventListener('click', () => VM?.indefiniteTurn());


elements.ghostTurnBtn.addEventListener('click', () => {
	w.collabvm.ghostTurn = !w.collabvm.ghostTurn;
	if (w.collabvm.ghostTurn)
		elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOn);
	else
		elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOff);
});

async function sendQEMUCommand() {
	if (!elements.qemuMonitorInput.value) return;
	let cmd = elements.qemuMonitorInput.value;
	elements.qemuMonitorOutput.innerHTML += `&gt; ${cmd}\n`;
	elements.qemuMonitorInput.value = '';
	let response = await VM?.qemuMonitor(cmd);
	elements.qemuMonitorOutput.innerHTML += `${response}\n`;
	elements.qemuMonitorOutput.scrollTop = elements.qemuMonitorOutput.scrollHeight;
}
elements.qemuMonitorSendBtn.addEventListener('click', () => sendQEMUCommand());
elements.qemuMonitorInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendQEMUCommand());

elements.osk.addEventListener('click', () => elements.oskContainer.classList.toggle('d-none'));

let darkTheme = true;
function loadColorTheme(dark : boolean) {
	if (dark) {
		darkTheme = true;
		document.children[0].setAttribute("data-bs-theme", "dark");
		elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_LightMode);
		elements.toggleThemeIcon.classList.remove("fa-moon");
		elements.toggleThemeIcon.classList.add("fa-sun");
	} else {
		darkTheme = false;
		document.children[0].setAttribute("data-bs-theme", "light");
		elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_DarkMode);
		elements.toggleThemeIcon.classList.remove("fa-sun");
		elements.toggleThemeIcon.classList.add("fa-moon");
	}
}
elements.toggleThemeBtn.addEventListener('click', e => {
	e.preventDefault();
	loadColorTheme(!darkTheme);
	localStorage.setItem("cvm-dark-theme", darkTheme ? "1" : "0");
	return false;
});

// Public API
w.collabvm = {
	openVM: openVM,
	closeVM: closeVM,
	loadList: loadList,
	multicollab: multicollab,
	getVM: () => VM,
	ghostTurn: false,
};
// Multicollab will stay in the global scope for backwards compatibility
w.multicollab = multicollab;
// Same goes for GetAdmin
w.GetAdmin = () => {
	if (VM === null) return;
	return {
		adminInstruction: (...args: string[]) => {
			args.unshift('admin');
			VM?.send(...args);
		},
		restore: () => VM!.restore(),
		reboot: () => VM!.reboot(),
		clearQueue: () => VM!.clearQueue(),
		bypassTurn: () => VM!.bypassTurn(),
		endTurn: (username: string) => VM!.endTurn(username),
		ban: (username: string) => VM!.ban(username),
		kick: (username: string) => VM!.kick(username),
		renameUser: (oldname: string, newname: string) => VM!.renameUser(oldname, newname),
		mute: (username: string, state: number) => VM!.mute(username, state),
		getip: (username: string) => VM!.getip(username),
		qemuMonitor: (cmd: string) => {
			VM?.qemuMonitor(cmd);
			return;
		},
		globalXss: (msg: string) => VM!.xss(msg),
		forceVote: (result: boolean) => VM!.forceVote(result)
	};
};
// more backwards compatibility
w.cvmEvents = {
	on: (event: string | number, cb: (...args: any) => void) => {
		if (VM === null) return;
		VM.on('message', (...args: any) => cb(...args));
	}
};
w.VMName = null;

document.addEventListener('DOMContentLoaded', async () => {
	// Initalize the i18n system
	await TheI18n.Init();
	TheI18n.on('languageChanged', lang => {
		// Update all dynamic text
		if (VM) {
			document.title = Format('{0} - {1}', VM.getNode()!, TheI18n.GetString(I18nStringKey.kGeneric_CollabVM));
			if (turn !== -1) {
				if (turn === 0) elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_TurnTimeTimer, turnTimer);
				else elements.turnstatus.innerText = TheI18n.GetString(I18nStringKey.kVM_WaitingTurnTimer, turnTimer);
				elements.turnBtnText.innerText = TheI18n.GetString(I18nStringKey.kVMButtons_EndTurn);
			}
			else
				elements.turnBtnText.innerText = TheI18n.GetString(I18nStringKey.kVMButtons_TakeTurn);
			if (VM!.getVoteStatus())
			elements.voteTimeText.innerText = TheI18n.GetString(I18nStringKey.kVM_VoteForResetTimer, voteTimer);

		}
		else {
			document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);
		}
		if (!auth || !auth.account) elements.accountDropdownUsername.innerText = TheI18n.GetString(I18nStringKey.kNotLoggedIn);
		if (darkTheme) elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_LightMode);
		else elements.toggleThemeBtnText.innerHTML = TheI18n.GetString(I18nStringKey.kSiteButtons_DarkMode);

		if (w.collabvm.ghostTurn)
			elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOn);
		else
			elements.ghostTurnBtnText.innerText = TheI18n.GetString(I18nStringKey.kAdminVMButtons_GhostTurnOff);

		for (const user of users) {
			if (user.user.countryCode !== null) {
				user.flagElement.title = TheI18n.getCountryName(user.user.countryCode);
			}
		}
	});
	// Load theme
	var _darktheme : boolean;
	// Check if dark theme is set in local storage
	if (localStorage.getItem("cvm-dark-theme") !== null)
		loadColorTheme(localStorage.getItem("cvm-dark-theme") === "1");
	// Otherwise, try to detect the system theme
	else if (window.matchMedia('(prefers-color-scheme: dark)').matches)
		loadColorTheme(true);
	else
		loadColorTheme(false);
	// Initialize authentication if enabled
	if (Config.Auth.Enabled) {
		resetAuthVar(new AuthManager(Config.Auth.APIEndpoint));
		renderAuth();
	}

	var hideFlag = JSON.parse(localStorage.getItem("collabvm-hide-flag")!);
	if (hideFlag === null) hideFlag = false;
	elements.hideFlagCheckbox.checked = hideFlag;

	document.title = TheI18n.GetString(I18nStringKey.kGeneric_CollabVM);

	// Load all VMs
	loadList();

	// Welcome modal
	let welcomeModal = new bootstrap.Modal(document.getElementById('welcomeModal') as HTMLDivElement);
	let noWelcomeModal = window.localStorage.getItem(Config.WelcomeModalLocalStorageKey);
	if (noWelcomeModal !== '1') {
		let welcomeModalDismissBtn = document.getElementById('welcomeModalDismiss') as HTMLButtonElement;
		welcomeModalDismissBtn.addEventListener('click', () => {
			window.localStorage.setItem(Config.WelcomeModalLocalStorageKey, '1');
		});
		welcomeModalDismissBtn.disabled = true;
		welcomeModal.show();
		setTimeout(() => {
			welcomeModalDismissBtn.disabled = false;
		}, 5000);
	}
	elements.rulesBtn.addEventListener('click', e => {
		if (TheI18n.CurrentLanguage() !== "en-us") {
			e.preventDefault();
			welcomeModal.show();
		}
	});
});
