import { VM } from "./main";
import CollabVMClient from "./protocol/CollabVMClient";
import { Format } from './format.js';

let expectedClose: boolean = false;

async function openVM(vm: typeof VM): Promise<void> {
	// If there's an active VM it must be closed before opening another
	if (VM !== null) return;
	expectedClose = false;
	// Set hash*
    //@ts-ignore
	location.hash = vm.id;
	// Create the client
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
	chatMessage('', `<b>${vm.id}</b><hr>`);
	let username = Config.Auth.Enabled ? (auth!.account?.username ?? null) : localStorage.getItem('username');
	let connected = await VM.connect(vm.id, username);
	elements.adminInputVMID.value = vm.id;
	w.VMName = vm.id;
	if (!connected) {
		// just give up
		closeVM();
		throw new Error('Failed to connect to node');
	}
	// Set the title
	document.title = Format('{0} - {1}', vm.id, TheI18n.GetString(I18nStringKey.kGeneric_CollabVM));
	// Append canvas
	elements.vmDisplay.appendChild(VM!.canvas);
	// Switch to the VM view
	elements.vmlist.style.display = 'none';
	elements.vmview.style.display = 'block';
	return;
}

function closeVM() {
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
