import dayjs from 'dayjs';
import { I18nStringKey, TheI18n } from '../i18n/i18n.js';
import { elements } from '../elements.js';
import * as bootstrap from 'bootstrap';
import { closeVM, VM } from '../VMhandlers.js';

export default class AuthManager {
    apiEndpoint : string;
    info : AuthServerInformation | null;
    account : Account | null;
    constructor(apiEndpoint : string) {
        this.apiEndpoint = apiEndpoint;
        this.info = null;
        this.account = null;
    }

    getAPIInformation() : Promise<AuthServerInformation> {
        return new Promise(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/info");
            this.info = await data.json();
            res(this.info!);
        })
    }

    login(username : string, password : string, captchaToken : string | undefined, turnstileToken : string | undefined, recaptchaToken : string | undefined) : Promise<AccountLoginResult> {
        return new Promise(async (res,rej) => {
            if (!this.info) throw new Error("Cannot login before fetching API information.");
            if (!captchaToken && this.info.hcaptcha?.required) throw new Error("This API requires a valid hCaptcha token.");
            if (!turnstileToken && this.info.turnstile?.required) throw new Error("This API requires a valid Turnstile token.");
            if (!recaptchaToken && this.info.recaptcha?.required) throw new Error("This API requires a valid reCAPTCHA token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    captchaToken: captchaToken,
                    turnstileToken: turnstileToken,
                    recaptchaToken: recaptchaToken
                })
            });
            var json = await data.json() as AccountLoginResult;
            if (!json) throw new Error("data.json() gave null or undefined result");
            if (json.success && !json.verificationRequired) {
                this.account = {
                    username: json.username!,
                    email: json.email!,
                    sessionToken: json.token!
                }
            }
            res(json);
        })
    }

    loadSession(token : string) {
        return new Promise<SessionResult>(async (res, rej) => {
            var data = await fetch(this.apiEndpoint + "/api/v1/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: token,
                })
            });
            var json = await data.json() as SessionResult;
            if (json.success) {
                this.account = {
                    sessionToken: token,
                    username: json.username!,
                    email: json.email!,
                };
            }
            res(json);
        })
    }

    register(username : string, password : string, email : string, dateOfBirth : dayjs.Dayjs, captchaToken : string | undefined, turnstileToken: string | undefined, recaptchaToken : string | undefined) : Promise<AccountRegisterResult> {
        return new Promise(async (res, rej) => {
            if (!this.info) throw new Error("Cannot login before fetching API information.");
            if (!captchaToken && this.info.hcaptcha?.required) throw new Error("This API requires a valid hCaptcha token.");
            if (!turnstileToken && this.info.turnstile?.required) throw new Error("This API requires a valid Turnstile token.");
            if (!recaptchaToken && this.info.recaptcha?.required) throw new Error("This API requires a valid reCAPTCHA token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    email: email,
                    dateOfBirth: dateOfBirth.format("YYYY-MM-DD"),
                    captchatoken: captchaToken,
                    turnstiletoken: turnstileToken,
                    recaptchaToken: recaptchaToken
                })
            });
            res(await data.json() as AccountRegisterResult);
        });
    }

    logout() {
        return new Promise<LogoutResult>(async res => {
            if (!this.account) throw new Error("Cannot log out without logging in first");
            var data = await fetch(this.apiEndpoint + "/api/v1/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: this.account.sessionToken
                })
            });
            var json = await data.json() as LogoutResult;
            this.account = null;
            res(json);
        })
    }

    verifyEmail(username : string, password : string, code : string) {
        return new Promise<VerifyEmailResult>(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                    code: code,
                })
            });
            res(await data.json() as VerifyEmailResult);
        });
    }

    updateAccount(currentPassword : string, newEmail : string | undefined, newUsername : string | undefined, newPassword : string | undefined) {
        return new Promise<UpdateAccountResult>(async res => {
            if (!this.account) throw new Error("Cannot update account without being logged in.");
            if (!newEmail && !newUsername && !newPassword) throw new Error("Cannot update account without any new information.");
            var data = await fetch(this.apiEndpoint + "/api/v1/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token: this.account!.sessionToken,
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    username: newUsername,
                    email: newEmail,
                })
            });
            var json = await data.json() as UpdateAccountResult;
            if (json.success) {
                if (this.account!.email !== newEmail) this.account!.email = newEmail!;
                if (this.account!.username !== newUsername) this.account!.username = newUsername!;
                if (json.sessionExpired || json.verificationRequired) {
                    this.account = null;
                }
            }
            res(json);
        });
    }

    sendPasswordResetEmail(username : string, email : string, captchaToken : string | undefined, turnstileToken : string | undefined, recaptchaToken : string | undefined) {
        return new Promise<PasswordResetResult>(async res => {
            if (!this.info) throw new Error("Cannot send password reset email without fetching API information.");
            if (!captchaToken && this.info.hcaptcha?.required) throw new Error("This API requires a valid hCaptcha token.");
            if (!turnstileToken && this.info.turnstile?.required) throw new Error("This API requires a valid Turnstile token.");
            if (!recaptchaToken && this.info.recaptcha?.required) throw new Error("This API requires a valid reCAPTCHA token.");
            var data = await fetch(this.apiEndpoint + "/api/v1/sendreset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    captchaToken: captchaToken,
                    turnstileToken: turnstileToken,
                    recaptchaToken: recaptchaToken
                })
            });
            res(await data.json() as PasswordResetResult);
        });
    }

    resetPassword(username : string, email : string, code : string, newPassword : string) {
        return new Promise<PasswordResetResult>(async res => {
            var data = await fetch(this.apiEndpoint + "/api/v1/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    code: code,
                    newPassword: newPassword
                })
            });
            res(await data.json() as PasswordResetResult);
        });
    }
}

export interface AuthServerInformation {
    registrationOpen : boolean;
    hcaptcha : {
        required : boolean;
        siteKey : string | undefined;
    };
    turnstile : {
        required : boolean;
        siteKey : string | undefined;
    };
    recaptcha : {
        required : boolean;
        siteKey : string | undefined;
    }
}

export interface AccountRegisterResult {
    success : boolean;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    username : string | undefined;
    email : string | undefined;
    sessionToken : string | undefined;
}

export interface AccountLoginResult {
    success : boolean;
    token : string | undefined;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    email : string | undefined;
    username : string | undefined;
}

export interface SessionResult {
    success : boolean;
    error : string | undefined;
    banned : boolean;
    username : string | undefined;
    email : string | undefined;
}

export interface VerifyEmailResult {
    success : boolean;
    error : string | undefined;
    sessionToken : string | undefined;
}

export interface LogoutResult {
    success : boolean;
    error : string | undefined;
}

export interface Account {
    username : string;
    email : string;
    sessionToken : string;
}

export interface UpdateAccountResult {
    success : boolean;
    error : string | undefined;
    verificationRequired : boolean | undefined;
    sessionExpired : boolean | undefined;
}

export interface PasswordResetResult {
    success : boolean;
    error : string | undefined;
}

// dom shits
export let auth : AuthManager|null = null;
export function resetAuthVar(_a: AuthManager|null): AuthManager|null {
    auth = _a;
    return auth;
}
export async function renderAuth() {
    if (auth === null) throw new Error("Cannot renderAuth when auth is null.");
    await auth.getAPIInformation();
    elements.accountDropdownUsername.innerText = TheI18n.GetString(I18nStringKey.kNotLoggedIn);
    elements.accountDropdownMenuLink.style.display = "block";
    if (!auth!.info!.registrationOpen)
        elements.accountRegisterButton.style.display = "none";
    else
        elements.accountRegisterButton.style.display = "block";
    elements.accountLoginButton.style.display = "block";
    elements.accountSettingsButton.style.display = "none";
    elements.accountLogoutButton.style.display = "none";
    
    for (let element of document.querySelectorAll("[id^=accountRegisterCaptcha-], [id^=accountLoginCaptcha-], [id^=accountResetPasswordCaptcha-]")) {
        hcaptcha.remove((element as HTMLElement).parentElement!.getAttribute("data-hcaptcha-widget-id")!);
        element.remove();
    }

    for (let element of document.querySelectorAll("[id^=accountRegisterTurnstile-], [id^=accountLoginTurnstile-], [id^=accountResetPasswordTurnstile-]")) {
        turnstile.remove((element as HTMLElement).parentElement!.getAttribute("data-turnstile-widget-id")!);
        element.remove();
    }

    for (let element of document.querySelectorAll("[id^=accountRegisterRecaptcha-], [id^=accountLoginRecaptcha-], [id^=accountResetPasswordRecaptcha-]")) {
        grecaptcha.reset(parseInt((element as HTMLElement).parentElement!.getAttribute("data-recaptcha-widget-id")!));
        element.remove();
    }

    if (auth!.info!.hcaptcha?.required) {
        const hconfig = { sitekey: auth!.info!.hcaptcha.siteKey! };
    
        let renderHcaptcha = () => {
            let uuid = Math.random().toString(36).substring(7);

            let accountRegisterCaptcha = document.createElement("div");
            accountRegisterCaptcha.id = `accountRegisterCaptcha-${uuid}`;
            elements.accountRegisterCaptchaContainer.appendChild(accountRegisterCaptcha);

            let accountLoginCaptcha = document.createElement("div");
            accountLoginCaptcha.id = `accountLoginCaptcha-${uuid}`;
            elements.accountLoginCaptchaContainer.appendChild(accountLoginCaptcha);

            let accountResetPasswordCaptcha = document.createElement("div");
            accountResetPasswordCaptcha.id = `accountResetPasswordCaptcha-${uuid}`;
            elements.accountResetPasswordCaptchaContainer.appendChild(accountResetPasswordCaptcha);

            const hCaptchaRegisterWidgetId = hcaptcha.render(accountRegisterCaptcha, hconfig);
            const hCaptchaLoginWidgetId = hcaptcha.render(accountLoginCaptcha, hconfig);
            const hCaptchaResetPasswordWidgetId = hcaptcha.render(accountResetPasswordCaptcha, hconfig);

            elements.accountRegisterCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaRegisterWidgetId!);
            elements.accountLoginCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaLoginWidgetId!);
            elements.accountResetPasswordCaptchaContainer.setAttribute("data-hcaptcha-widget-id", hCaptchaResetPasswordWidgetId!);
        };
    
        if (typeof hcaptcha === "undefined") {
            let script = document.createElement("script");
            script.src = "https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=hCaptchaLoad";
            (window as any).hCaptchaLoad = renderHcaptcha;
            document.head.appendChild(script);
        } else {
            renderHcaptcha();
        }
    }
    
    if (auth!.info?.turnstile?.required) {
        const turnstileConfig = { sitekey: auth!.info!.turnstile.siteKey! };
    
        let renderTurnstile = () => {
            let uuid = Math.random().toString(36).substring(7);

            let accountRegisterTurnstile = document.createElement("div");
            accountRegisterTurnstile.id = `accountRegisterTurnstile-${uuid}`;
            elements.accountRegisterTurnstileContainer.appendChild(accountRegisterTurnstile);

            let accountLoginTurnstile = document.createElement("div");
            accountLoginTurnstile.id = `accountLoginTurnstile-${uuid}`;
            elements.accountLoginTurnstileContainer.appendChild(accountLoginTurnstile);

            let accountResetPasswordTurnstile = document.createElement("div");
            accountResetPasswordTurnstile.id = `accountResetPasswordTurnstile-${uuid}`;
            elements.accountResetPasswordTurnstileContainer.appendChild(accountResetPasswordTurnstile);

            const turnstileRegisterWidgetId = turnstile.render(accountRegisterTurnstile, turnstileConfig);
            const turnstileLoginWidgetId = turnstile.render(accountLoginTurnstile, turnstileConfig);
            const turnstileResetPasswordWidgetId = turnstile.render(accountResetPasswordTurnstile, turnstileConfig);

            elements.accountRegisterTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileRegisterWidgetId!);
            elements.accountLoginTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileLoginWidgetId!);
            elements.accountResetPasswordTurnstileContainer.setAttribute("data-turnstile-widget-id", turnstileResetPasswordWidgetId!);
        };
    
        if (typeof turnstile === "undefined") {
            let script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=turnstileLoad";
            (window as any).turnstileLoad = renderTurnstile;
            document.head.appendChild(script);
        } else {
            renderTurnstile();
        }
    }
    
    if (auth!.info?.recaptcha?.required) {
        const recaptchaConfig = { sitekey: auth!.info!.recaptcha.siteKey! };
    
        let renderRecaptcha = () => {
            let uuid = Math.random().toString(36).substring(7);

            let accountRegisterRecaptcha = document.createElement("div");
            accountRegisterRecaptcha.id = `accountRegisterRecaptcha-${uuid}`;
            elements.accountRegisterRecaptchaContainer.appendChild(accountRegisterRecaptcha);

            let accountLoginRecaptcha = document.createElement("div");
            accountLoginRecaptcha.id = `accountLoginRecaptcha-${uuid}`;
            elements.accountLoginRecaptchaContainer.appendChild(accountLoginRecaptcha);

            let accountResetPasswordRecaptcha = document.createElement("div");
            accountResetPasswordRecaptcha.id = `accountResetPasswordRecaptcha-${uuid}`;
            elements.accountResetPasswordRecaptchaContainer.appendChild(accountResetPasswordRecaptcha);

            const RecaptchaRegisterWidgetId = grecaptcha.render(accountRegisterRecaptcha, recaptchaConfig);
            const RecaptchaLoginWidgetId = grecaptcha.render(accountLoginRecaptcha, recaptchaConfig);
            const RecaptchaResetPasswordWidgetId = grecaptcha.render(accountResetPasswordRecaptcha, recaptchaConfig);
    
            elements.accountRegisterRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaRegisterWidgetId!.toString());
            elements.accountLoginRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaLoginWidgetId!.toString());
            elements.accountResetPasswordRecaptchaContainer.setAttribute("data-recaptcha-widget-id", RecaptchaResetPasswordWidgetId!.toString());
        };
    
        if (typeof grecaptcha === "undefined") {
            let script = document.createElement("script");
            script.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaLoad";
            (window as any).recaptchaLoad = renderRecaptcha;
            document.head.appendChild(script);
        } else {
            grecaptcha.ready(renderRecaptcha);
        }
    }	

    var token = localStorage.getItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
    if (token) {
        var result = await auth!.loadSession(token);
        if (result.success) {
            loadAccount();
        } else {
            localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
        }
    }
}
function loadAccount() {
	if (auth === null || auth.account === null) throw new Error("Cannot loadAccount when auth or auth.account is null.");
	elements.accountDropdownUsername.innerText = auth!.account!.username;
	elements.accountLoginButton.style.display = "none";
	elements.accountRegisterButton.style.display = "none";
	elements.accountSettingsButton.style.display = "block";
	elements.accountLogoutButton.style.display = "block";
	if (VM) VM.loginAccount(auth.account.sessionToken);
}
const accountModal = new bootstrap.Modal(elements.accountModal);
elements.accountModalErrorDismiss.addEventListener('click', () => elements.accountModalError.style.display = "none");
elements.accountModalSuccessDismiss.addEventListener('click', () => elements.accountModalSuccess.style.display = "none");
elements.accountLoginButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kGeneric_Login);
	elements.accountRegisterSection.style.display = "none";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "block";
	elements.accountSettingsSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	accountModal.show();
});
elements.accountRegisterButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kGeneric_Register);
	elements.accountRegisterSection.style.display = "block";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "none";
	elements.accountSettingsSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	accountModal.show();
});
elements.accountSettingsButton.addEventListener("click", () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_AccountSettings);
	elements.accountRegisterSection.style.display = "none";
	elements.accountVerifyEmailSection.style.display = "none";
	elements.accountLoginSection.style.display = "none";
	elements.accountSettingsSection.style.display = "block";
	elements.accountResetPasswordSection.style.display = "none";
	elements.accountResetPasswordVerifySection.style.display = "none";
	// Fill fields
	elements.accountSettingsUsername.value = auth!.account!.username;
	elements.accountSettingsEmail.value = auth!.account!.email;
	accountModal.show();
});
elements.accountLogoutButton.addEventListener('click', async () => {
	if (!auth?.account) return;
	await auth.logout();
	localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
	if (VM) closeVM();
	renderAuth();
});
elements.accountForgotPasswordButton.addEventListener('click', () => {
	elements.accountModalTitle.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_ResetPassword);
	elements.accountLoginSection.style.display = "none";
	elements.accountResetPasswordSection.style.display = "block";
});
// i dont know if theres a better place to put this
let accountBeingVerified;
//@ts-ignore
elements.accountLoginForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountLoginCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountLoginTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountLoginRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
	}

	var username = elements.accountLoginUsername.value;
	var password = elements.accountLoginPassword.value;
	var result = await auth!.login(username, password, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
	if (result.success) {
		elements.accountLoginUsername.value = "";
		elements.accountLoginPassword.value = "";
		if (result.verificationRequired) {
			accountBeingVerified = result.username;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, result.email!);
			elements.accountLoginSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		}
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.token!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
//@ts-ignore
elements.accountRegisterForm.addEventListener('submit', async (e) => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountRegisterCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountRegisterTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountRegisterRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
	}

	var username = elements.accountRegisterUsername.value;
	var password = elements.accountRegisterPassword.value;
	var email = elements.accountRegisterEmail.value;
	var dob = dayjs(elements.accountRegisterDateOfBirth.valueAsDate);
	if (password !== elements.accountRegisterConfirmPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	var result = await auth!.register(username, password, email, dob, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
	if (result.success) {
		elements.accountRegisterUsername.value = "";
		elements.accountRegisterEmail.value = "";
		elements.accountRegisterPassword.value = "";
		elements.accountRegisterConfirmPassword.value = "";
		elements.accountRegisterDateOfBirth.value = "";
		if (result.verificationRequired) {
			accountBeingVerified = result.username;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, result.email!);
			elements.accountRegisterSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		}
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.sessionToken!);
		await auth!.loadSession(result.sessionToken!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
//@ts-ignore
elements.accountVerifyEmailForm.addEventListener('submit', async e => {
	e.preventDefault();
	var username = accountBeingVerified!;
	var code = elements.accountVerifyEmailCode.value;
	var password = elements.accountVerifyEmailPassword.value;
	var result = await auth!.verifyEmail(username, password, code);
	if (result.success) {
		elements.accountVerifyEmailCode.value = "";
		elements.accountVerifyEmailPassword.value = "";
		localStorage.setItem("collabvm_session_" + new URL(auth!.apiEndpoint).host, result.sessionToken!);
		await auth!.loadSession(result.sessionToken!);
		loadAccount();
		accountModal.hide();
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
//@ts-ignore
elements.accountSettingsForm.addEventListener('submit', async e => {
	e.preventDefault();
	var oldUsername = auth!.account!.username;
	var oldEmail = auth!.account!.email;
	var username = elements.accountSettingsUsername.value === auth!.account!.username ? undefined : elements.accountSettingsUsername.value;
	var email = elements.accountSettingsEmail.value === auth!.account!.email ? undefined : elements.accountSettingsEmail.value;
	var password = elements.accountSettingsNewPassword.value === "" ? undefined : elements.accountSettingsNewPassword.value;
	var currentPassword = elements.accountSettingsCurrentPassword.value;
	if (password && password !== elements.accountSettingsConfirmNewPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	localStorage.setItem("collabvm-hide-flag", JSON.stringify(elements.hideFlagCheckbox.checked));
	if (!password && !email && !username) {
		accountModal.hide();
		return false
	}
	var result = await auth!.updateAccount(currentPassword, email, username, password);
	if (result.success) {
		elements.accountSettingsNewPassword.value = "";
		elements.accountSettingsConfirmNewPassword.value = "";
		elements.accountSettingsCurrentPassword.value = "";
		if (result.verificationRequired) {
			renderAuth();
			accountBeingVerified = username ?? oldUsername;
			elements.accountVerifyEmailText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyText, email ?? oldEmail);
			elements.accountSettingsSection.style.display = "none";
			elements.accountVerifyEmailSection.style.display = "block";
			return false;
		} else if (result.sessionExpired) {
			accountModal.hide();
			localStorage.removeItem("collabvm_session_" + new URL(auth!.apiEndpoint).host);
			if (VM) closeVM();
			renderAuth();
		} else {
			accountModal.hide();
		}
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
let resetPasswordUsername;
let resetPasswordEmail;
//@ts-ignore
elements.accountResetPasswordForm.addEventListener('submit', async e => {
	e.preventDefault();
	var hcaptchaToken = undefined;
	var hcaptchaID = undefined;
	if (auth!.info!.hcaptcha?.required) {
		hcaptchaID = elements.accountResetPasswordCaptchaContainer.getAttribute("data-hcaptcha-widget-id")!
		var response = hcaptcha.getResponse(hcaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		hcaptchaToken = response;
	}

	var turnstileToken = undefined;
	var turnstileID = undefined;

	if (auth!.info!.turnstile?.required) {
		turnstileID = elements.accountResetPasswordTurnstileContainer.getAttribute("data-turnstile-widget-id")!
		var response: string = turnstile.getResponse(turnstileID) || "";
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		turnstileToken = response;
	}

	var recaptchaToken = undefined;
	var recaptchaID = undefined;

	if (auth!.info!.recaptcha?.required) {
		recaptchaID = parseInt(elements.accountResetPasswordRecaptchaContainer.getAttribute("data-recaptcha-widget-id")!)
		var response = grecaptcha.getResponse(recaptchaID);
		if (response === "") {
			elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kMissingCaptcha);
			elements.accountModalError.style.display = "block";
			return false;
		}
		recaptchaToken = response;
	}

	var username = elements.accountResetPasswordUsername.value;
	var email = elements.accountResetPasswordEmail.value;
	var result = await auth!.sendPasswordResetEmail(username, email, hcaptchaToken, turnstileToken, recaptchaToken);
	if (auth!.info!.hcaptcha?.required) hcaptcha.reset(hcaptchaID);
	if (auth!.info!.turnstile?.required) turnstile.reset(turnstileID);
	if (auth!.info!.recaptcha?.required) grecaptcha.reset(recaptchaID);
	if (result.success) {
		resetPasswordUsername = username;
		resetPasswordEmail = email;
		elements.accountResetPasswordUsername.value = "";
		elements.accountResetPasswordEmail.value = "";
		elements.accountVerifyPasswordResetText.innerText = TheI18n.GetString(I18nStringKey.kAccountModal_VerifyPasswordResetText, email);
		elements.accountResetPasswordSection.style.display = "none";
		elements.accountResetPasswordVerifySection.style.display = "block";
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
//@ts-ignore
elements.accountResetPasswordVerifyForm.addEventListener('submit', async e => {
	e.preventDefault();
	var code = elements.accountResetPasswordCode.value;
	var password = elements.accountResetPasswordNewPassword.value;
	if (password !== elements.accountResetPasswordConfirmNewPassword.value) {
		elements.accountModalErrorText.innerHTML = TheI18n.GetString(I18nStringKey.kPasswordsMustMatch);
		elements.accountModalError.style.display = "block";
		return false;
	}
	var result = await auth!.resetPassword(resetPasswordUsername!, resetPasswordEmail!, code, password);
	if (result.success) {
		elements.accountResetPasswordCode.value = "";
		elements.accountResetPasswordNewPassword.value = "";
		elements.accountResetPasswordConfirmNewPassword.value = "";
		elements.accountModalSuccessText.innerHTML = TheI18n.GetString(I18nStringKey.kAccountModal_PasswordResetSuccess);
		elements.accountModalSuccess.style.display = "block";
		elements.accountResetPasswordVerifySection.style.display = "none";
		elements.accountLoginSection.style.display = "block";
		
	} else {
		elements.accountModalErrorText.innerHTML = result.error!;
		elements.accountModalError.style.display = "block";
	}
	return false;
});
